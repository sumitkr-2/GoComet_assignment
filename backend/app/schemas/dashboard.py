from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.rfq import RFQListOut
from app.schemas.activity import ActivityLogOut

class BiddingActivityDataPoint(BaseModel):
    date: str
    bids_count: int
    extensions_count: int

class DashboardStatsOut(BaseModel):
    total_auctions: int
    active_auctions: int
    completed_auctions: int
    force_closed_auctions: int
    total_submitted_bids: int
    total_suppliers_participating: int
    recent_rfqs: List[RFQListOut]
    recent_activity: List[ActivityLogOut]
    activity_chart_data: List[BiddingActivityDataPoint]
