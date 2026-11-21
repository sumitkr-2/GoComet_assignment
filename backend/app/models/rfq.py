import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RFQStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    FORCE_CLOSED = "FORCE_CLOSED"

class ExtensionTriggerType(str, enum.Enum):
    BID_RECEIVED = "BID_RECEIVED"          # Type A: Bid Received in Last X Minutes
    ANY_RANK_CHANGE = "ANY_RANK_CHANGE"    # Type B: Any Supplier Rank Change in Last X Minutes
    L1_RANK_CHANGE = "L1_RANK_CHANGE"      # Type C: Lowest Bidder (L1) Rank Change in Last X Minutes

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    bid_start_time = Column(DateTime, nullable=False)
    original_close_time = Column(DateTime, nullable=False)
    current_close_time = Column(DateTime, nullable=False)
    forced_close_time = Column(DateTime, nullable=False)
    
    pickup_service_date = Column(DateTime, nullable=False)
    status = Column(Enum(RFQStatus), nullable=False, default=RFQStatus.UPCOMING)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    buyer = relationship("User", back_populates="rfqs")
    auction_config = relationship("AuctionConfiguration", back_populates="rfq", uselist=False, cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")
    activity_logs = relationship("AuctionActivityLog", back_populates="rfq", cascade="all, delete-orphan")

class AuctionConfiguration(Base):
    __tablename__ = "auction_configurations"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), unique=True, nullable=False)
    british_auction_enabled = Column(Boolean, default=True, nullable=False)
    trigger_window_minutes = Column(Float, nullable=False, default=10.0)
    extension_duration_minutes = Column(Float, nullable=False, default=5.0)
    extension_trigger_type = Column(Enum(ExtensionTriggerType), nullable=False, default=ExtensionTriggerType.BID_RECEIVED)

    rfq = relationship("RFQ", back_populates="auction_config")
