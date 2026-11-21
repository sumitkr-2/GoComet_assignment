from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class AuctionActivityLog(Base):
    __tablename__ = "auction_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    event_type = Column(String(50), nullable=False) # e.g., AUCTION_CREATED, BID_SUBMITTED, BID_UPDATED, AUCTION_EXTENDED, RANKING_CHANGED, AUCTION_CLOSED, AUCTION_FORCE_CLOSED
    event_description = Column(Text, nullable=False)
    
    previous_close_time = Column(DateTime, nullable=True)
    updated_close_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    rfq = relationship("RFQ", back_populates="activity_logs")
    supplier = relationship("Supplier", back_populates="activity_logs")

    __table_args__ = (
        Index("ix_activity_rfq_created", "rfq_id", "created_at"),
    )
