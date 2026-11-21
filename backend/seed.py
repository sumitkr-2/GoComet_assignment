from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models.user import User, Supplier, UserRole
from app.models.rfq import RFQ, AuctionConfiguration, RFQStatus, ExtensionTriggerType
from app.models.quotation import Quotation
from app.models.activity import AuctionActivityLog
from app.core.security import get_password_hash

def seed_demo_data(db: Session):
    # Check if data already seeded
    if db.query(User).first():
        return

    print("--- Seeding Demo Procurement Data ---")
    now = datetime.utcnow()

    # 1. Create Buyer
    buyer = User(
        name="Rajesh Sharma (Procurement Lead)",
        email="buyer@cocomet.com",
        password_hash=get_password_hash("Buyer@123"),
        role=UserRole.BUYER,
        created_at=now - timedelta(days=10)
    )
    db.add(buyer)
    db.flush()

    # 2. Create Suppliers
    suppliers_data = [
        ("Amit Verma", "supplier1@cocomet.com", "Supplier@123", "BlueDart Express Freight", "+91 98765 43210"),
        ("Vikram Singh", "supplier2@cocomet.com", "Supplier@123", "DHL Global Forwarding", "+91 98765 43211"),
        ("Pooja Patel", "supplier3@cocomet.com", "Supplier@123", "Maersk Logistics India", "+91 98765 43212")
    ]

    supplier_models = []
    for name, email, pwd, company, phone in suppliers_data:
        u = User(
            name=name,
            email=email,
            password_hash=get_password_hash(pwd),
            role=UserRole.SUPPLIER,
            created_at=now - timedelta(days=10)
        )
        db.add(u)
        db.flush()
        s = Supplier(
            user_id=u.id,
            company_name=company,
            contact_phone=phone,
            created_at=now - timedelta(days=10)
        )
        db.add(s)
        db.flush()
        supplier_models.append(s)

    s1, s2, s3 = supplier_models

    # 3. Create Sample RFQs
    # RFQ 1: Fast Demo for Live Evaluation (Trigger: 2m window, 1m extension)
    # Closing in 90 seconds from now!
    rfq_fast = RFQ(
        reference_id="RFQ-FAST-001",
        name="Urgent Pharma Freight - Mumbai to Delhi (Live Demo)",
        buyer_id=buyer.id,
        bid_start_time=now - timedelta(minutes=15),
        original_close_time=now + timedelta(seconds=90),
        current_close_time=now + timedelta(seconds=90),
        forced_close_time=now + timedelta(minutes=10),
        pickup_service_date=now + timedelta(days=3),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(minutes=15)
    )
    db.add(rfq_fast)
    db.flush()

    cfg_fast = AuctionConfiguration(
        rfq_id=rfq_fast.id,
        british_auction_enabled=True,
        trigger_window_minutes=2.0,
        extension_duration_minutes=1.0,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    )
    db.add(cfg_fast)

    q1_fast = Quotation(
        rfq_id=rfq_fast.id,
        supplier_id=s1.id,
        carrier_name="BlueDart Prime Air",
        freight_charges=35000.0,
        origin_charges=5000.0,
        destination_charges=4500.0,
        total_amount=44500.0,
        transit_time="24 Hours",
        quote_validity="7 Days",
        submitted_at=now - timedelta(minutes=5)
    )
    db.add(q1_fast)

    db.add(AuctionActivityLog(
        rfq_id=rfq_fast.id,
        supplier_id=None,
        event_type="AUCTION_CREATED",
        event_description="RFQ created with British Auction enabled (2m window, 1m extension).",
        previous_close_time=rfq_fast.original_close_time,
        updated_close_time=rfq_fast.current_close_time,
        created_at=now - timedelta(minutes=15)
    ))
    db.add(AuctionActivityLog(
        rfq_id=rfq_fast.id,
        supplier_id=s1.id,
        event_type="BID_SUBMITTED",
        event_description="Quotation of ₹44,500.00 submitted by BlueDart Express Freight. Rank: L1.",
        previous_close_time=rfq_fast.current_close_time,
        updated_close_time=rfq_fast.current_close_time,
        created_at=now - timedelta(minutes=5)
    ))

    # RFQ 2: Heavy Machinery (Type B: Any Rank Change)
    rfq_2 = RFQ(
        reference_id="RFQ-2026-002",
        name="Heavy Industrial Machinery - Chennai to Pune",
        buyer_id=buyer.id,
        bid_start_time=now - timedelta(hours=2),
        original_close_time=now + timedelta(hours=3),
        current_close_time=now + timedelta(hours=3),
        forced_close_time=now + timedelta(hours=6),
        pickup_service_date=now + timedelta(days=7),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(hours=2)
    )
    db.add(rfq_2)
    db.flush()

    cfg_2 = AuctionConfiguration(
        rfq_id=rfq_2.id,
        british_auction_enabled=True,
        trigger_window_minutes=10.0,
        extension_duration_minutes=5.0,
        extension_trigger_type=ExtensionTriggerType.ANY_RANK_CHANGE
    )
    db.add(cfg_2)

    # Initial bids for RFQ 2: s1=₹85,000 (L3), s2=₹78,000 (L2), s3=₹72,000 (L1)
    bids_rfq2 = [
        (s1, "BlueDart HeavyHaul", 60000.0, 15000.0, 10000.0, 85000.0, "4 Days", "14 Days", now - timedelta(minutes=90)),
        (s2, "DHL SmartFreight", 55000.0, 13000.0, 10000.0, 78000.0, "3 Days", "14 Days", now - timedelta(minutes=60)),
        (s3, "Maersk Overland", 50000.0, 12000.0, 10000.0, 72000.0, "3 Days", "14 Days", now - timedelta(minutes=30)),
    ]
    for supp, car, f, o, d, tot, tt, qv, sub_time in bids_rfq2:
        db.add(Quotation(
            rfq_id=rfq_2.id,
            supplier_id=supp.id,
            carrier_name=car,
            freight_charges=f,
            origin_charges=o,
            destination_charges=d,
            total_amount=tot,
            transit_time=tt,
            quote_validity=qv,
            submitted_at=sub_time
        ))

    db.add(AuctionActivityLog(
        rfq_id=rfq_2.id,
        supplier_id=s3.id,
        event_type="RANKING_CHANGED",
        event_description="Leaderboard updated: Maersk Logistics India: L1 (₹72,000.00), DHL Global Forwarding: L2 (₹78,000.00), BlueDart Express Freight: L3 (₹85,000.00)",
        previous_close_time=rfq_2.current_close_time,
        updated_close_time=rfq_2.current_close_time,
        created_at=now - timedelta(minutes=30)
    ))

    # RFQ 3: Consumer Electronics (Type C: L1 Rank Change)
    rfq_3 = RFQ(
        reference_id="RFQ-2026-003",
        name="Consumer Electronics Distribution - Bengaluru to Hyderabad",
        buyer_id=buyer.id,
        bid_start_time=now - timedelta(hours=1),
        original_close_time=now + timedelta(hours=4),
        current_close_time=now + timedelta(hours=4),
        forced_close_time=now + timedelta(hours=8),
        pickup_service_date=now + timedelta(days=5),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(hours=1)
    )
    db.add(rfq_3)
    db.flush()

    cfg_3 = AuctionConfiguration(
        rfq_id=rfq_3.id,
        british_auction_enabled=True,
        trigger_window_minutes=15.0,
        extension_duration_minutes=10.0,
        extension_trigger_type=ExtensionTriggerType.L1_RANK_CHANGE
    )
    db.add(cfg_3)

    db.add(Quotation(
        rfq_id=rfq_3.id,
        supplier_id=s2.id,
        carrier_name="DHL AirSecure",
        freight_charges=28000.0,
        origin_charges=4000.0,
        destination_charges=3500.0,
        total_amount=35500.0,
        transit_time="2 Days",
        quote_validity="10 Days",
        submitted_at=now - timedelta(minutes=20)
    ))

    # RFQ 4: Closed RFQ
    rfq_4 = RFQ(
        reference_id="RFQ-2026-004",
        name="Automotive Components - Gurgaon to Manesar",
        buyer_id=buyer.id,
        bid_start_time=now - timedelta(days=2),
        original_close_time=now - timedelta(days=1),
        current_close_time=now - timedelta(days=1),
        forced_close_time=now - timedelta(hours=20),
        pickup_service_date=now + timedelta(days=2),
        status=RFQStatus.CLOSED,
        created_at=now - timedelta(days=2)
    )
    db.add(rfq_4)
    db.flush()
    db.add(AuctionConfiguration(
        rfq_id=rfq_4.id,
        british_auction_enabled=True,
        trigger_window_minutes=10.0,
        extension_duration_minutes=5.0,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    ))
    db.add(Quotation(
        rfq_id=rfq_4.id,
        supplier_id=s1.id,
        carrier_name="BlueDart Surface",
        freight_charges=18000.0,
        origin_charges=2000.0,
        destination_charges=1500.0,
        total_amount=21500.0,
        transit_time="1 Day",
        quote_validity="30 Days",
        submitted_at=now - timedelta(days=1, hours=2)
    ))
    db.add(AuctionActivityLog(
        rfq_id=rfq_4.id,
        supplier_id=None,
        event_type="AUCTION_CLOSED",
        event_description="Auction bidding closed. Winner: BlueDart Express Freight (L1 - ₹21,500.00).",
        previous_close_time=rfq_4.current_close_time,
        updated_close_time=rfq_4.current_close_time,
        created_at=now - timedelta(days=1)
    ))

    # RFQ 5: Force Closed RFQ
    rfq_5 = RFQ(
        reference_id="RFQ-2026-005",
        name="Emergency Cold-Chain Vaccines - Ahmedabad to Kolkata",
        buyer_id=buyer.id,
        bid_start_time=now - timedelta(days=3),
        original_close_time=now - timedelta(days=2, hours=1),
        current_close_time=now - timedelta(days=2),
        forced_close_time=now - timedelta(days=2),
        pickup_service_date=now - timedelta(days=1),
        status=RFQStatus.FORCE_CLOSED,
        created_at=now - timedelta(days=3)
    )
    db.add(rfq_5)
    db.flush()
    db.add(AuctionConfiguration(
        rfq_id=rfq_5.id,
        british_auction_enabled=True,
        trigger_window_minutes=10.0,
        extension_duration_minutes=10.0,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    ))
    db.add(AuctionActivityLog(
        rfq_id=rfq_5.id,
        supplier_id=None,
        event_type="AUCTION_FORCE_CLOSED",
        event_description="Auction force closed upon reaching hard forced limit.",
        previous_close_time=rfq_5.current_close_time,
        updated_close_time=rfq_5.forced_close_time,
        created_at=now - timedelta(days=2)
    ))

    db.commit()
    print("--- Database Seeding Complete ---")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_demo_data(session)
    session.close()
