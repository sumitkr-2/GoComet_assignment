from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator

class QuotationCreate(BaseModel):
    carrier_name: str = Field(..., min_length=2, max_length=100)
    freight_charges: float = Field(..., ge=0, description="Freight charges (cannot be negative)")
    origin_charges: float = Field(..., ge=0, description="Origin charges (cannot be negative)")
    destination_charges: float = Field(..., ge=0, description="Destination charges (cannot be negative)")
    transit_time: str = Field(..., min_length=1, max_length=50, description="Transit time, e.g. 3 Days")
    quote_validity: str = Field(..., min_length=1, max_length=50, description="Quote validity, e.g. 30 Days")

class QuotationOut(BaseModel):
    id: int
    rfq_id: int
    supplier_id: int
    supplier_company_name: Optional[str] = None
    carrier_name: str
    freight_charges: float
    origin_charges: float
    destination_charges: float
    total_amount: float
    transit_time: str
    quote_validity: str
    submitted_at: datetime
    is_latest: bool = True
    rank: Optional[str] = None # e.g. "L1", "L2"

    class Config:
        from_attributes = True

class QuotationSubmitResponse(BaseModel):
    quotation: QuotationOut
    rank: str
    is_l1: bool
    rank_changed: bool
    auction_extended: bool
    previous_close_time: Optional[datetime] = None
    new_close_time: Optional[datetime] = None
    extension_reason: Optional[str] = None
