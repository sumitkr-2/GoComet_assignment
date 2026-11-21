from datetime import datetime, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.rfq import RFQ, RFQStatus
from app.models.quotation import Quotation
from app.models.activity import AuctionActivityLog
from app.models.user import User, Supplier
from app.schemas.dashboard import DashboardStatsOut, BiddingActivityDataPoint
from app.schemas.activity import ActivityLogOut
from app.core.deps import get_current_user
from app.services.rfq_service import RFQService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes real-time procurement statistics from actual database records.
    """
    all_rfqs = db.query(RFQ).all()
    for rfq in all_rfqs:
        RFQService.sync_rfq_status(db, rfq)

    total_auctions = len(all_rfqs)
    active_auctions = sum(1 for r in all_rfqs if r.status == RFQStatus.ACTIVE)
    completed_auctions = sum(1 for r in all_rfqs if r.status in (RFQStatus.CLOSED, RFQStatus.FORCE_CLOSED))
    force_closed_auctions = sum(1 for r in all_rfqs if r.status == RFQStatus.FORCE_CLOSED)

    total_submitted_bids = db.query(Quotation).count()
    total_suppliers = db.query(Supplier).count()

    recent_rfqs_dtos = RFQService.list_rfqs(db)[:5]

    recent_logs = (
        db.query(AuctionActivityLog)
        .order_by(AuctionActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    recent_activity_dtos = [
        ActivityLogOut(
            id=log.id,
            rfq_id=log.rfq_id,
            supplier_id=log.supplier_id,
            supplier_company_name=log.supplier.company_name if log.supplier else None,
            event_type=log.event_type,
            event_description=log.event_description,
            previous_close_time=log.previous_close_time,
            updated_close_time=log.updated_close_time,
            created_at=log.created_at
        )
        for log in recent_logs
    ]

    # Generate 7-day activity chart data from actual DB records
    today = datetime.utcnow().date()
    chart_data: List[BiddingActivityDataPoint] = []
    
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)

        bids_count = (
            db.query(Quotation)
            .filter(Quotation.submitted_at >= day_start, Quotation.submitted_at < day_end)
            .count()
        )
        extensions_count = (
            db.query(AuctionActivityLog)
            .filter(
                AuctionActivityLog.event_type == "AUCTION_EXTENDED",
                AuctionActivityLog.created_at >= day_start,
                AuctionActivityLog.created_at < day_end
            )
            .count()
        )

        chart_data.append(
            BiddingActivityDataPoint(
                date=day.strftime("%b %d"),
                bids_count=bids_count,
                extensions_count=extensions_count
            )
        )

    return DashboardStatsOut(
        total_auctions=total_auctions,
        active_auctions=active_auctions,
        completed_auctions=completed_auctions,
        force_closed_auctions=force_closed_auctions,
        total_submitted_bids=total_submitted_bids,
        total_suppliers_participating=total_suppliers,
        recent_rfqs=recent_rfqs_dtos,
        recent_activity=recent_activity_dtos,
        activity_chart_data=chart_data
    )
