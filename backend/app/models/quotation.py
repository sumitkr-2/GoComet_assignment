from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    carrier_name = Column(String(100), nullable=False)
    freight_charges = Column(Float, nullable=False)
    origin_charges = Column(Float, nullable=False)
    destination_charges = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False, index=True)
    
    transit_time = Column(String(50), nullable=False)  # e.g., "3 Business Days", "48 Hours"
    quote_validity = Column(String(50), nullable=False) # e.g., "15 Days", "2026-12-31"
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    rfq = relationship("RFQ", back_populates="quotations")
    supplier = relationship("Supplier", back_populates="quotations")

    __table_args__ = (
        Index("ix_rfq_supplier_submitted", "rfq_id", "supplier_id", "submitted_at"),
    )
