from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SupplierRankItem(BaseModel):
    supplier_id: int
    company_name: str
    rank: str  # e.g., "L1", "L2", "L3"
    total_amount: float
    carrier_name: str
    freight_charges: float
    origin_charges: float
    destination_charges: float
    transit_time: str
    quote_validity: str
    submitted_at: datetime
    is_current_user: bool = False

class RFQRankingsOut(BaseModel):
    rfq_id: int
    total_suppliers: int
    current_lowest_bid: Optional[float] = None
    l1_supplier_id: Optional[int] = None
    l1_company_name: Optional[str] = None
    rankings: list[SupplierRankItem]
