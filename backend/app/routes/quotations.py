from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.quotation import Quotation
from app.models.user import User, Supplier
from app.schemas.quotation import QuotationCreate, QuotationOut, QuotationSubmitResponse
from app.core.deps import get_current_user, get_current_supplier
from app.services.auction_engine import BritishAuctionEngine
from app.services.ranking_service import RankingService

router = APIRouter(prefix="/rfqs/{id}/bids", tags=["Quotations & Bidding"])

@router.post("", response_model=QuotationSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_bid(
    id: int,
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Submits or lowers a supplier's quotation for the specified RFQ.
    Triggers the British Auction extension engine if qualifying criteria are met.
    """
    return BritishAuctionEngine.submit_quotation(db, rfq_id=id, supplier=supplier, quote_in=quote_in)

@router.get("", response_model=List[QuotationOut])
def get_rfq_bids(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all submitted quotation bids for an RFQ, sorted by submission time descending.
    Preserves quotation history.
    """
    quotes = (
        db.query(Quotation)
        .filter(Quotation.rfq_id == id)
        .order_by(Quotation.submitted_at.desc())
        .all()
    )

    rankings_dict = RankingService.get_rankings_dict(db, id)
    latest_quotes = RankingService.get_latest_quotations_per_supplier(db, id)
    latest_quote_ids = {q.id for q in latest_quotes}

    results = []
    for q in quotes:
        results.append(
            QuotationOut(
                id=q.id,
                rfq_id=q.rfq_id,
                supplier_id=q.supplier_id,
                supplier_company_name=q.supplier.company_name if q.supplier else None,
                carrier_name=q.carrier_name,
                freight_charges=q.freight_charges,
                origin_charges=q.origin_charges,
                destination_charges=q.destination_charges,
                total_amount=q.total_amount,
                transit_time=q.transit_time,
                quote_validity=q.quote_validity,
                submitted_at=q.submitted_at,
                is_latest=(q.id in latest_quote_ids),
                rank=rankings_dict.get(q.supplier_id) if (q.id in latest_quote_ids) else None
            )
        )
    return results
