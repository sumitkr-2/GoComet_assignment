from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.activity import AuctionActivityLog
from app.models.user import User
from app.schemas.activity import ActivityLogOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/rfqs/{id}/activity", tags=["Activity Logs"])

@router.get("", response_model=List[ActivityLogOut])
def get_rfq_activity_logs(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns chronological audit logs for the specified RFQ, including bid submissions,
    extensions, ranking shifts, and forced closing events.
    """
    logs = (
        db.query(AuctionActivityLog)
        .filter(AuctionActivityLog.rfq_id == id)
        .order_by(AuctionActivityLog.created_at.desc())
        .all()
    )

    results = []
    for log in logs:
        results.append(
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
        )
    return results
