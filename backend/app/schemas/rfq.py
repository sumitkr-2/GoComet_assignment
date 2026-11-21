from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.models.rfq import RFQStatus, ExtensionTriggerType

class AuctionConfigBase(BaseModel):
    british_auction_enabled: bool = True
    trigger_window_minutes: float = Field(default=10.0, gt=0, description="Trigger window X in minutes")
    extension_duration_minutes: float = Field(default=5.0, gt=0, description="Extension duration Y in minutes")
    extension_trigger_type: ExtensionTriggerType = ExtensionTriggerType.BID_RECEIVED

class AuctionConfigOut(AuctionConfigBase):
    id: int
    rfq_id: int

    class Config:
        from_attributes = True

class RFQCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    reference_id: str = Field(..., min_length=2, max_length=50)
    bid_start_time: datetime
    bid_close_time: datetime
    forced_close_time: datetime
    pickup_service_date: datetime
    
    british_auction_enabled: bool = True
    trigger_window_minutes: float = Field(default=10.0, gt=0)
    extension_duration_minutes: float = Field(default=5.0, gt=0)
    extension_trigger_type: ExtensionTriggerType = ExtensionTriggerType.BID_RECEIVED

    @model_validator(mode="after")
    def validate_times(self):
        if self.bid_start_time >= self.bid_close_time:
            raise ValueError("Bid Start Time must be strictly earlier than Bid Close Time.")
        if self.bid_close_time >= self.forced_close_time:
            raise ValueError("Forced Bid Close Time must be strictly later than Bid Close Time.")
        if self.trigger_window_minutes <= 0:
            raise ValueError("Trigger Window must be a positive number.")
        if self.extension_duration_minutes <= 0:
            raise ValueError("Extension Duration must be a positive number.")
        return self

class RFQListOut(BaseModel):
    id: int
    reference_id: str
    name: str
    buyer_id: int
    buyer_name: Optional[str] = None
    bid_start_time: datetime
    original_close_time: datetime
    current_close_time: datetime
    forced_close_time: datetime
    pickup_service_date: datetime
    status: RFQStatus
    created_at: datetime
    
    current_lowest_bid: Optional[float] = None
    lowest_bidder_name: Optional[str] = None
    total_bids_count: int = 0
    total_suppliers_count: int = 0
    is_extended: bool = False
    
    auction_config: Optional[AuctionConfigOut] = None

    class Config:
        from_attributes = True

class RFQDetailOut(RFQListOut):
    pass
