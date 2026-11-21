from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.quotation import Quotation
from app.models.user import Supplier
from app.schemas.ranking import SupplierRankItem, RFQRankingsOut

class RankingService:
    @staticmethod
    def get_latest_quotations_per_supplier(db: Session, rfq_id: int) -> List[Quotation]:
        """
        For an RFQ, returns each participating supplier's latest quotation.
        """
        all_quotes = (
            db.query(Quotation)
            .filter(Quotation.rfq_id == rfq_id)
            .order_by(Quotation.submitted_at.desc())
            .all()
        )
        
        seen_suppliers = set()
        latest_quotes = []
        for q in all_quotes:
            if q.supplier_id not in seen_suppliers:
                seen_suppliers.add(q.supplier_id)
                latest_quotes.append(q)
                
        return latest_quotes

    @classmethod
    def calculate_rankings(
        cls, 
        db: Session, 
        rfq_id: int, 
        current_supplier_id: Optional[int] = None
    ) -> Tuple[List[SupplierRankItem], Optional[float], Optional[int]]:
        """
        Computes deterministic rankings (L1, L2, L3...) based on total_amount ASC,
        tie-breaking by submitted_at ASC.
        Returns: (rank_items, current_lowest_bid, l1_supplier_id)
        """
        latest_quotes = cls.get_latest_quotations_per_supplier(db, rfq_id)
        if not latest_quotes:
            return [], None, None

        # Sort: lower total_amount wins; earlier submission breaks ties deterministically
        sorted_quotes = sorted(
            latest_quotes, 
            key=lambda q: (round(q.total_amount, 4), q.submitted_at)
        )

        supplier_ids = [q.supplier_id for q in sorted_quotes]
        suppliers_map = {
            s.id: s for s in db.query(Supplier).filter(Supplier.id.in_(supplier_ids)).all()
        }

        rank_items: List[SupplierRankItem] = []
        for idx, q in enumerate(sorted_quotes, start=1):
            rank_label = f"L{idx}"
            supp = suppliers_map.get(q.supplier_id)
            company_name = supp.company_name if supp else f"Supplier #{q.supplier_id}"
            
            rank_items.append(
                SupplierRankItem(
                    supplier_id=q.supplier_id,
                    company_name=company_name,
                    rank=rank_label,
                    total_amount=round(q.total_amount, 2),
                    carrier_name=q.carrier_name,
                    freight_charges=round(q.freight_charges, 2),
                    origin_charges=round(q.origin_charges, 2),
                    destination_charges=round(q.destination_charges, 2),
                    transit_time=q.transit_time,
                    quote_validity=q.quote_validity,
                    submitted_at=q.submitted_at,
                    is_current_user=(current_supplier_id is not None and q.supplier_id == current_supplier_id)
                )
            )

        lowest_bid = rank_items[0].total_amount if rank_items else None
        l1_supplier_id = rank_items[0].supplier_id if rank_items else None

        return rank_items, lowest_bid, l1_supplier_id

    @classmethod
    def get_rankings_dict(cls, db: Session, rfq_id: int) -> Dict[int, str]:
        """
        Returns a dict mapping {supplier_id: 'L1', ...} for current active quotes.
        """
        rank_items, _, _ = cls.calculate_rankings(db, rfq_id)
        return {item.supplier_id: item.rank for item in rank_items}
