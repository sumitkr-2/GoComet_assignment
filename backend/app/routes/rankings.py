from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.ranking import RFQRankingsOut
from app.core.deps import get_current_user
from app.services.ranking_service import RankingService
from app.services.rfq_service import RFQService

router = APIRouter(prefix="/rfqs/{id}/rankings", tags=["Rankings"])

@router.get("", response_model=RFQRankingsOut)
def get_rfq_rankings(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the real-time supplier ranking leaderboard (L1, L2, L3...) for an RFQ.
    """
    rfq = RFQService.get_rfq_by_id(db, id)
    
    current_supp_id = current_user.supplier_profile.id if (current_user.role == UserRole.SUPPLIER and current_user.supplier_profile) else None
    
    items, lowest_bid, l1_supplier_id = RankingService.calculate_rankings(
        db, rfq.id, current_supplier_id=current_supp_id
    )

    l1_company_name = None
    if items:
        l1_company_name = items[0].company_name

    return RFQRankingsOut(
        rfq_id=rfq.id,
        total_suppliers=len(items),
        current_lowest_bid=lowest_bid,
        l1_supplier_id=l1_supplier_id,
        l1_company_name=l1_company_name,
        rankings=items
    )
