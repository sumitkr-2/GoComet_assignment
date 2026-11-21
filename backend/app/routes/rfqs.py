from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.rfq import RFQCreate, RFQListOut, RFQDetailOut
from app.core.deps import get_current_user, get_current_buyer
from app.services.rfq_service import RFQService

router = APIRouter(prefix="/rfqs", tags=["RFQs"])

@router.post("", response_model=RFQDetailOut, status_code=status.HTTP_201_CREATED)
def create_rfq(
    rfq_in: RFQCreate,
    db: Session = Depends(get_db),
    current_buyer: User = Depends(get_current_buyer)
):
    """
    Creates a new RFQ with British Auction configuration. Buyer role required.
    """
    rfq = RFQService.create_rfq(db, rfq_in, current_buyer.id)
    return RFQService.get_rfq_dto(db, rfq)

@router.get("", response_model=List[RFQListOut])
def list_rfqs(
    status: Optional[str] = Query(None, description="Filter by status: UPCOMING, ACTIVE, CLOSED, FORCE_CLOSED"),
    search: Optional[str] = Query(None, description="Search by name or reference ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all RFQs with current auction statistics and rankings. Accessible by all authenticated users.
    """
    return RFQService.list_rfqs(db, status_filter=status, search=search)

@router.get("/{id}", response_model=RFQDetailOut)
def get_rfq_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches full details of a specific RFQ.
    """
    rfq = RFQService.get_rfq_by_id(db, id)
    return RFQService.get_rfq_dto(db, rfq)
