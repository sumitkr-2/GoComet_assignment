from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.rfq import RFQ, RFQStatus, ExtensionTriggerType
from app.models.quotation import Quotation
from app.models.user import Supplier
from app.models.activity import AuctionActivityLog
from app.schemas.quotation import QuotationCreate, QuotationOut, QuotationSubmitResponse
from app.services.ranking_service import RankingService
from app.services.rfq_service import RFQService

class BritishAuctionEngine:
    @classmethod
    def submit_quotation(
        cls,
        db: Session,
        rfq_id: int,
        supplier: Supplier,
        quote_in: QuotationCreate,
        submission_time: Optional[datetime] = None
    ) -> QuotationSubmitResponse:
        """
        Processes a supplier quotation submission within a database transaction:
        1. Validates auction state and time boundaries.
        2. Validates monetary values and ensures new bid is lower than supplier's previous bid.
        3. Computes pre-bid rankings.
        4. Persists the new quotation.
        5. Computes post-bid rankings.
        6. Evaluates British Auction Extension Triggers (A, B, C).
        7. Enforces forced close capping.
        8. Generates all audit logs.
        """
        now = submission_time or datetime.utcnow()

        # 1. Fetch RFQ & Sync status
        rfq = db.query(RFQ).filter(RFQ.id == rfq_id).with_for_update().first() if db.bind.dialect.name != "sqlite" else db.query(RFQ).filter(RFQ.id == rfq_id).first()
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"RFQ with ID {rfq_id} does not exist."
            )

        RFQService.sync_rfq_status(db, rfq, current_time=now)

        if now < rfq.bid_start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auction has not started yet. Bidding opens at {rfq.bid_start_time.strftime('%Y-%m-%d %H:%M:%S UTC')}."
            )

        if rfq.status == RFQStatus.FORCE_CLOSED or now >= rfq.forced_close_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bidding rejected: Auction has reached its Forced Close Time and is permanently closed."
            )

        if rfq.status == RFQStatus.CLOSED or now >= rfq.current_close_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bidding rejected: Auction bidding window has closed."
            )

        # 2. Monetary calculations
        freight = round(quote_in.freight_charges, 2)
        origin = round(quote_in.origin_charges, 2)
        destination = round(quote_in.destination_charges, 2)
        total_amount = round(freight + origin + destination, 2)

        if freight < 0 or origin < 0 or destination < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monetary charges cannot be negative."
            )

        # Check existing quotations by this supplier
        previous_quotes = (
            db.query(Quotation)
            .filter(Quotation.rfq_id == rfq.id, Quotation.supplier_id == supplier.id)
            .order_by(Quotation.submitted_at.desc())
            .all()
        )

        is_update = False
        if previous_quotes:
            best_prev_quote = min(previous_quotes, key=lambda q: q.total_amount)
            if total_amount >= best_prev_quote.total_amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Competitive Reverse Auction rule: Your new quotation (₹{total_amount:,.2f}) "
                        f"must be strictly lower than your previous best quotation (₹{best_prev_quote.total_amount:,.2f})."
                    )
                )
            is_update = True

        # 3. Pre-bid rankings & L1 state
        prev_rankings_dict = RankingService.get_rankings_dict(db, rfq.id)
        _, _, prev_l1_id = RankingService.calculate_rankings(db, rfq.id)

        # 4. Insert new quotation
        new_quotation = Quotation(
            rfq_id=rfq.id,
            supplier_id=supplier.id,
            carrier_name=quote_in.carrier_name,
            freight_charges=freight,
            origin_charges=origin,
            destination_charges=destination,
            total_amount=total_amount,
            transit_time=quote_in.transit_time,
            quote_validity=quote_in.quote_validity,
            submitted_at=now
        )
        db.add(new_quotation)
        db.flush()

        # 5. Post-bid rankings & L1 state
        post_rank_items, _, new_l1_id = RankingService.calculate_rankings(db, rfq.id, current_supplier_id=supplier.id)
        post_rankings_dict = {item.supplier_id: item.rank for item in post_rank_items}
        
        my_new_rank_item = next((item for item in post_rank_items if item.supplier_id == supplier.id), None)
        current_user_rank = my_new_rank_item.rank if my_new_rank_item else "N/A"
        is_l1 = (new_l1_id == supplier.id)

        rank_changed = (prev_rankings_dict != post_rankings_dict)

        # 6. British Auction Extension Evaluation
        config = rfq.auction_config
        auction_extended = False
        prev_close_time = rfq.current_close_time
        updated_close_time = rfq.current_close_time
        extension_reason = None

        if config and config.british_auction_enabled:
            # Trigger Window Check:
            # Monitors activity in [current_close_time - X minutes, current_close_time]
            trigger_window_delta = timedelta(minutes=config.trigger_window_minutes)
            window_start = rfq.current_close_time - trigger_window_delta

            is_in_trigger_window = (window_start <= now <= rfq.current_close_time)

            if is_in_trigger_window:
                should_extend = False
                trigger_explanation = ""

                # Evaluate Extension Trigger Type
                if config.extension_trigger_type == ExtensionTriggerType.BID_RECEIVED:
                    # Type A: Any valid bid during trigger window
                    should_extend = True
                    trigger_explanation = (
                        f"Extension Trigger A (Bid Received): New quotation of ₹{total_amount:,.2f} "
                        f"submitted by {supplier.company_name} within the last {config.trigger_window_minutes} minutes."
                    )

                elif config.extension_trigger_type == ExtensionTriggerType.ANY_RANK_CHANGE:
                    # Type B: Any supplier rank change during trigger window
                    if rank_changed:
                        should_extend = True
                        trigger_explanation = (
                            f"Extension Trigger B (Any Rank Change): Supplier rankings altered by "
                            f"{supplier.company_name}'s quotation of ₹{total_amount:,.2f} (now {current_user_rank}) "
                            f"within the last {config.trigger_window_minutes} minutes."
                        )

                elif config.extension_trigger_type == ExtensionTriggerType.L1_RANK_CHANGE:
                    # Type C: Lowest bidder (L1) rank change during trigger window
                    # Extends ONLY if the identity of the L1 supplier changes.
                    # If current L1 reduces own bid and remains L1, do not extend.
                    l1_identity_changed = (new_l1_id != prev_l1_id)
                    if l1_identity_changed and is_l1:
                        should_extend = True
                        prev_l1_name = "None"
                        if prev_l1_id:
                            prev_supp = db.query(Supplier).filter(Supplier.id == prev_l1_id).first()
                            if prev_supp:
                                prev_l1_name = prev_supp.company_name
                        trigger_explanation = (
                            f"Extension Trigger C (L1 Rank Change): New lowest bidder (L1) emerged! "
                            f"{supplier.company_name} dethroned {prev_l1_name} with bid of ₹{total_amount:,.2f} "
                            f"within the last {config.trigger_window_minutes} minutes."
                        )

                # If trigger condition met, compute new closing time
                if should_extend:
                    extension_delta = timedelta(minutes=config.extension_duration_minutes)
                    tentative_close = rfq.current_close_time + extension_delta
                    
                    # 7. Forced Close Capping Rule:
                    # new_close_time = min(current_close_time + extension_duration, forced_close_time)
                    new_close = min(tentative_close, rfq.forced_close_time)

                    if new_close > rfq.current_close_time:
                        rfq.current_close_time = new_close
                        updated_close_time = new_close
                        auction_extended = True
                        extension_reason = trigger_explanation
                        if new_close == rfq.forced_close_time and tentative_close > rfq.forced_close_time:
                            extension_reason += f" (Capped at Forced Close Time: {rfq.forced_close_time.strftime('%Y-%m-%d %H:%M:%S UTC')})."

                        # Log Auction Extension
                        ext_log = AuctionActivityLog(
                            rfq_id=rfq.id,
                            supplier_id=supplier.id,
                            event_type="AUCTION_EXTENDED",
                            event_description=extension_reason,
                            previous_close_time=prev_close_time,
                            updated_close_time=updated_close_time,
                            created_at=now
                        )
                        db.add(ext_log)

        # 8. Log Bid Submission / Update
        bid_event_type = "BID_UPDATED" if is_update else "BID_SUBMITTED"
        bid_log = AuctionActivityLog(
            rfq_id=rfq.id,
            supplier_id=supplier.id,
            event_type=bid_event_type,
            event_description=(
                f"Quotation of ₹{total_amount:,.2f} (Freight: ₹{freight:,.2f}, Origin: ₹{origin:,.2f}, Destination: ₹{destination:,.2f}) "
                f"submitted by {supplier.company_name} [{quote_in.carrier_name}]. Current Rank: {current_user_rank}."
            ),
            previous_close_time=prev_close_time,
            updated_close_time=updated_close_time,
            created_at=now
        )
        db.add(bid_log)

        # 9. Log Ranking Change if occurred
        if rank_changed:
            rank_summary = ", ".join([f"{item.company_name}: {item.rank} (₹{item.total_amount:,.2f})" for item in post_rank_items])
            rank_log = AuctionActivityLog(
                rfq_id=rfq.id,
                supplier_id=supplier.id,
                event_type="RANKING_CHANGED",
                event_description=f"Leaderboard updated: {rank_summary}",
                previous_close_time=prev_close_time,
                updated_close_time=updated_close_time,
                created_at=now
            )
            db.add(rank_log)

        db.commit()
        db.refresh(new_quotation)
        db.refresh(rfq)

        quote_out = QuotationOut(
            id=new_quotation.id,
            rfq_id=new_quotation.rfq_id,
            supplier_id=new_quotation.supplier_id,
            supplier_company_name=supplier.company_name,
            carrier_name=new_quotation.carrier_name,
            freight_charges=new_quotation.freight_charges,
            origin_charges=new_quotation.origin_charges,
            destination_charges=new_quotation.destination_charges,
            total_amount=new_quotation.total_amount,
            transit_time=new_quotation.transit_time,
            quote_validity=new_quotation.quote_validity,
            submitted_at=new_quotation.submitted_at,
            is_latest=True,
            rank=current_user_rank
        )

        return QuotationSubmitResponse(
            quotation=quote_out,
            rank=current_user_rank,
            is_l1=is_l1,
            rank_changed=rank_changed,
            auction_extended=auction_extended,
            previous_close_time=prev_close_time,
            new_close_time=updated_close_time,
            extension_reason=extension_reason
        )
