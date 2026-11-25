from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.rfq import RFQ, AuctionConfiguration, RFQStatus
from app.models.quotation import Quotation
from app.models.activity import AuctionActivityLog
from app.schemas.rfq import RFQCreate, RFQListOut, AuctionConfigOut, to_utc_naive
from app.services.ranking_service import RankingService

class RFQService:
    @staticmethod
    def sync_rfq_status(db: Session, rfq: RFQ, current_time: Optional[datetime] = None) -> RFQStatus:
        """
        Dynamically updates and persists the RFQ status based on the current time:
        - If now < bid_start_time -> UPCOMING
        - If now >= forced_close_time -> FORCE_CLOSED
        - If now >= current_close_time -> CLOSED
        - If bid_start_time <= now < current_close_time -> ACTIVE
        """
        now = to_utc_naive(current_time or datetime.utcnow())
        rfq.bid_start_time = to_utc_naive(rfq.bid_start_time)
        rfq.current_close_time = to_utc_naive(rfq.current_close_time)
        rfq.forced_close_time = to_utc_naive(rfq.forced_close_time)
        old_status = rfq.status

        if now >= rfq.forced_close_time:
            # If current_close_time reached forced_close_time or wall-clock is past forced_close_time
            new_status = RFQStatus.FORCE_CLOSED
        elif now >= rfq.current_close_time:
            new_status = RFQStatus.CLOSED
        elif now >= rfq.bid_start_time:
            new_status = RFQStatus.ACTIVE
        else:
            new_status = RFQStatus.UPCOMING

        if old_status != new_status:
            rfq.status = new_status
            event_type = "AUCTION_CLOSED"
            description = f"Auction automatically closed at {now.strftime('%Y-%m-%d %H:%M:%S UTC')}."
            if new_status == RFQStatus.FORCE_CLOSED:
                event_type = "AUCTION_FORCE_CLOSED"
                description = f"Auction force closed upon reaching forced limit {rfq.forced_close_time.strftime('%Y-%m-%d %H:%M:%S UTC')}."
            elif new_status == RFQStatus.ACTIVE:
                event_type = "AUCTION_STARTED"
                description = f"Auction bidding opened at {now.strftime('%Y-%m-%d %H:%M:%S UTC')}."

            log = AuctionActivityLog(
                rfq_id=rfq.id,
                event_type=event_type,
                event_description=description,
                previous_close_time=rfq.current_close_time,
                updated_close_time=rfq.current_close_time,
                created_at=now
            )
            db.add(log)
            db.commit()
            db.refresh(rfq)

        return rfq.status

    @classmethod
    def create_rfq(cls, db: Session, rfq_in: RFQCreate, buyer_id: int) -> RFQ:
        existing = db.query(RFQ).filter(RFQ.reference_id == rfq_in.reference_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"RFQ with Reference ID '{rfq_in.reference_id}' already exists."
            )

        now = datetime.utcnow()
        init_status = RFQStatus.ACTIVE if now >= rfq_in.bid_start_time else RFQStatus.UPCOMING

        rfq = RFQ(
            reference_id=rfq_in.reference_id,
            name=rfq_in.name,
            buyer_id=buyer_id,
            bid_start_time=rfq_in.bid_start_time,
            original_close_time=rfq_in.bid_close_time,
            current_close_time=rfq_in.bid_close_time,
            forced_close_time=rfq_in.forced_close_time,
            pickup_service_date=rfq_in.pickup_service_date,
            status=init_status,
            created_at=now
        )
        db.add(rfq)
        db.flush()

        config = AuctionConfiguration(
            rfq_id=rfq.id,
            british_auction_enabled=rfq_in.british_auction_enabled,
            trigger_window_minutes=rfq_in.trigger_window_minutes,
            extension_duration_minutes=rfq_in.extension_duration_minutes,
            extension_trigger_type=rfq_in.extension_trigger_type
        )
        db.add(config)

        # Log auction creation
        activity = AuctionActivityLog(
            rfq_id=rfq.id,
            event_type="AUCTION_CREATED",
            event_description=(
                f"RFQ '{rfq.name}' created by Buyer. British Auction: "
                f"{'Enabled' if rfq_in.british_auction_enabled else 'Disabled'} "
                f"(Trigger Window: {rfq_in.trigger_window_minutes}m, Duration: {rfq_in.extension_duration_minutes}m, "
                f"Trigger: {rfq_in.extension_trigger_type.value})."
            ),
            previous_close_time=rfq.original_close_time,
            updated_close_time=rfq.current_close_time,
            created_at=now
        )
        db.add(activity)

        db.commit()
        db.refresh(rfq)
        return rfq

    @classmethod
    def get_rfq_by_id(cls, db: Session, rfq_id: int) -> RFQ:
        rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"RFQ with ID {rfq_id} not found."
            )
        cls.sync_rfq_status(db, rfq)
        return rfq

    @classmethod
    def get_rfq_dto(cls, db: Session, rfq: RFQ) -> RFQListOut:
        cls.sync_rfq_status(db, rfq)
        
        _, lowest_bid, l1_supplier_id = RankingService.calculate_rankings(db, rfq.id)
        
        # Get count of total bids and distinct suppliers
        total_bids = db.query(Quotation).filter(Quotation.rfq_id == rfq.id).count()
        distinct_suppliers = db.query(Quotation.supplier_id).filter(Quotation.rfq_id == rfq.id).distinct().count()

        lowest_bidder_name = None
        if l1_supplier_id:
            from app.models.user import Supplier
            supp = db.query(Supplier).filter(Supplier.id == l1_supplier_id).first()
            if supp:
                lowest_bidder_name = supp.company_name

        config_dto = None
        if rfq.auction_config:
            config_dto = AuctionConfigOut(
                id=rfq.auction_config.id,
                rfq_id=rfq.auction_config.rfq_id,
                british_auction_enabled=rfq.auction_config.british_auction_enabled,
                trigger_window_minutes=rfq.auction_config.trigger_window_minutes,
                extension_duration_minutes=rfq.auction_config.extension_duration_minutes,
                extension_trigger_type=rfq.auction_config.extension_trigger_type
            )

        return RFQListOut(
            id=rfq.id,
            reference_id=rfq.reference_id,
            name=rfq.name,
            buyer_id=rfq.buyer_id,
            buyer_name=rfq.buyer.name if rfq.buyer else None,
            bid_start_time=rfq.bid_start_time,
            original_close_time=rfq.original_close_time,
            current_close_time=rfq.current_close_time,
            forced_close_time=rfq.forced_close_time,
            pickup_service_date=rfq.pickup_service_date,
            status=rfq.status,
            created_at=rfq.created_at,
            current_lowest_bid=lowest_bid,
            lowest_bidder_name=lowest_bidder_name,
            total_bids_count=total_bids,
            total_suppliers_count=distinct_suppliers,
            is_extended=(rfq.current_close_time > rfq.original_close_time),
            auction_config=config_dto
        )

    @classmethod
    def list_rfqs(
        cls, 
        db: Session, 
        status_filter: Optional[str] = None, 
        search: Optional[str] = None
    ) -> List[RFQListOut]:
        query = db.query(RFQ)
        
        if search:
            search_fmt = f"%{search}%"
            query = query.filter((RFQ.name.ilike(search_fmt)) | (RFQ.reference_id.ilike(search_fmt)))
            
        rfqs = query.order_by(RFQ.created_at.desc()).all()
        
        # Sync and format
        dtos = []
        for rfq in rfqs:
            cls.sync_rfq_status(db, rfq)
            if status_filter and rfq.status.value != status_filter:
                continue
            dtos.append(cls.get_rfq_dto(db, rfq))
            
        return dtos
