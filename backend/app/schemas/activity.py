from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ActivityLogOut(BaseModel):
    id: int
    rfq_id: int
    supplier_id: Optional[int] = None
    supplier_company_name: Optional[str] = None
    event_type: str
    event_description: str
    previous_close_time: Optional[datetime] = None
    updated_close_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
