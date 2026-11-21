from datetime import datetime, timedelta
import pytest
from fastapi import HTTPException
from app.models.rfq import RFQ, RFQStatus, AuctionConfiguration, ExtensionTriggerType
from app.models.quotation import Quotation
from app.schemas.quotation import QuotationCreate
from app.services.auction_engine import BritishAuctionEngine

def create_base_rfq(db, buyer_id, trigger_type, window_m=10.0, ext_m=5.0, duration_h=1.0, forced_h=1.5):
    now = datetime.utcnow()
    rfq = RFQ(
        reference_id=f"RFQ-TEST-{int(now.timestamp())}",
        name="Engine Test RFQ",
        buyer_id=buyer_id,
        bid_start_time=now - timedelta(minutes=10),
        original_close_time=now + timedelta(hours=duration_h),
        current_close_time=now + timedelta(hours=duration_h),
        forced_close_time=now + timedelta(hours=forced_h),
        pickup_service_date=now + timedelta(days=2),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(minutes=10)
    )
    db.add(rfq)
    db.flush()

    cfg = AuctionConfiguration(
        rfq_id=rfq.id,
        british_auction_enabled=True,
        trigger_window_minutes=window_m,
        extension_duration_minutes=ext_m,
        extension_trigger_type=trigger_type
    )
    db.add(cfg)
    db.commit()
    db.refresh(rfq)
    return rfq

def test_trigger_type_a_bid_received(db_session, buyer_user, suppliers):
    """Type A: ANY valid bid in trigger window triggers extension."""
    rfq = create_base_rfq(db_session, buyer_user.id, ExtensionTriggerType.BID_RECEIVED, window_m=10.0, ext_m=5.0)
    _, s1 = suppliers[0]

    # Close time is T+60m. Trigger window is [T+50m, T+60m].
    # Bid at T+20m (outside trigger window) -> NO extension
    t_outside = rfq.bid_start_time + timedelta(minutes=30)
    res_outside = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s1,
        QuotationCreate(carrier_name="C1", freight_charges=10000, origin_charges=1000, destination_charges=1000, transit_time="2d", quote_validity="10d"),
        submission_time=t_outside
    )
    assert res_outside.auction_extended is False
    assert rfq.current_close_time == rfq.original_close_time

    # Bid at T+55m (inside trigger window [T+50m, T+60m]) -> MUST EXTEND by 5m!
    t_inside = rfq.current_close_time - timedelta(minutes=5)
    _, s2 = suppliers[1]
    res_inside = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s2,
        QuotationCreate(carrier_name="C2", freight_charges=9000, origin_charges=1000, destination_charges=1000, transit_time="2d", quote_validity="10d"),
        submission_time=t_inside
    )
    assert res_inside.auction_extended is True
    assert rfq.current_close_time == rfq.original_close_time + timedelta(minutes=5)

def test_trigger_type_b_any_rank_change(db_session, buyer_user, suppliers):
    """Type B: Extends ONLY when any supplier's rank changes inside trigger window."""
    rfq = create_base_rfq(db_session, buyer_user.id, ExtensionTriggerType.ANY_RANK_CHANGE, window_m=10.0, ext_m=5.0)
    _, s1 = suppliers[0]
    _, s2 = suppliers[1]

    # S1 submits ₹50,000 before window
    t_before = rfq.current_close_time - timedelta(minutes=20)
    BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s1,
        QuotationCreate(carrier_name="C1", freight_charges=40000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_before
    )

    # In trigger window: S2 submits ₹60,000 -> S1 is L1, S2 is L2.
    # Was there a rank change? Prior to this, S1 was L1. S1 is STILL L1, but S2 joins as L2.
    # Let's see: previous rankings had {S1: L1}. New rankings has {S1: L1, S2: L2}.
    # Now let's test a bid by S2 that does NOT change rankings:
    # S2 currently at ₹60,000 (L2). S2 reduces to ₹55,000.
    # S1 is still L1 (₹50,000), S2 is still L2 (₹55,000).
    # Rankings before: {S1: 'L1', S2: 'L2'}. Rankings after: {S1: 'L1', S2: 'L2'}.
    # Under Type B, rank_changed is FALSE, so NO EXTENSION!
    t_window_1 = rfq.current_close_time - timedelta(minutes=8)
    BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s2,
        QuotationCreate(carrier_name="C2", freight_charges=50000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_window_1
    )

    close_after_s2_first = rfq.current_close_time

    # Now S2 reduces from 60k to 55k inside trigger window (still L2 behind S1's 50k)
    t_window_2 = rfq.current_close_time - timedelta(minutes=4)
    res_no_rank_change = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s2,
        QuotationCreate(carrier_name="C2", freight_charges=45000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_window_2
    )
    assert res_no_rank_change.rank_changed is False
    assert res_no_rank_change.auction_extended is False
    assert rfq.current_close_time == close_after_s2_first

    # Now S2 submits ₹45,000 (overtaking S1's 50,000 to become L1!)
    # Ranking changed: S2 moves L2 -> L1, S1 moves L1 -> L2!
    t_window_3 = rfq.current_close_time - timedelta(minutes=3)
    res_with_rank_change = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s2,
        QuotationCreate(carrier_name="C2", freight_charges=35000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_window_3
    )
    assert res_with_rank_change.rank_changed is True
    assert res_with_rank_change.auction_extended is True
    assert rfq.current_close_time > close_after_s2_first

def test_trigger_type_c_l1_rank_change(db_session, buyer_user, suppliers):
    """
    Type C: Extends ONLY when the identity of the L1 supplier changes.
    If the current L1 supplier simply reduces their own quotation while remaining L1,
    DO NOT extend under this trigger type.
    """
    rfq = create_base_rfq(db_session, buyer_user.id, ExtensionTriggerType.L1_RANK_CHANGE, window_m=10.0, ext_m=5.0)
    _, s1 = suppliers[0]
    _, s2 = suppliers[1]

    # S1 submits ₹50,000 before window -> S1 is L1
    t_before = rfq.current_close_time - timedelta(minutes=25)
    BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s1,
        QuotationCreate(carrier_name="C1", freight_charges=40000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_before
    )
    orig_close = rfq.current_close_time

    # Inside trigger window: Current L1 (S1) lowers their own bid to ₹48,000!
    # S1 remains L1. Identity of L1 did NOT change.
    # MUST NOT EXTEND!
    t_inside_1 = rfq.current_close_time - timedelta(minutes=5)
    res_s1_lower = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s1,
        QuotationCreate(carrier_name="C1", freight_charges=38000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_inside_1
    )
    assert res_s1_lower.is_l1 is True
    assert res_s1_lower.auction_extended is False
    assert rfq.current_close_time == orig_close

    # Inside trigger window: S2 submits ₹42,000 (beats S1 to become NEW L1!)
    # Identity of L1 changes from S1 to S2!
    # MUST EXTEND!
    t_inside_2 = rfq.current_close_time - timedelta(minutes=4)
    res_s2_l1 = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s2,
        QuotationCreate(carrier_name="C2", freight_charges=32000, origin_charges=5000, destination_charges=5000, transit_time="2d", quote_validity="10d"),
        submission_time=t_inside_2
    )
    assert res_s2_l1.is_l1 is True
    assert res_s2_l1.auction_extended is True
    assert rfq.current_close_time == orig_close + timedelta(minutes=5)

def test_forced_close_capping(db_session, buyer_user, suppliers):
    """Auction must never extend beyond the configured forced closing time."""
    now = datetime.utcnow()
    # Close is at T+10m, Forced close is at T+13m. Extension duration is 10m.
    rfq = RFQ(
        reference_id="RFQ-FORCE-TEST",
        name="Forced Close Cap RFQ",
        buyer_id=buyer_user.id,
        bid_start_time=now - timedelta(minutes=5),
        original_close_time=now + timedelta(minutes=10),
        current_close_time=now + timedelta(minutes=10),
        forced_close_time=now + timedelta(minutes=13),
        pickup_service_date=now + timedelta(days=2),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(minutes=5)
    )
    db_session.add(rfq)
    db_session.flush()

    cfg = AuctionConfiguration(
        rfq_id=rfq.id,
        british_auction_enabled=True,
        trigger_window_minutes=5.0,
        extension_duration_minutes=10.0,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    )
    db_session.add(cfg)
    db_session.commit()

    _, s1 = suppliers[0]
    t_inside = rfq.current_close_time - timedelta(minutes=2)
    res = BritishAuctionEngine.submit_quotation(
        db_session, rfq.id, s1,
        QuotationCreate(carrier_name="C1", freight_charges=10000, origin_charges=1000, destination_charges=1000, transit_time="2d", quote_validity="10d"),
        submission_time=t_inside
    )
    assert res.auction_extended is True
    # Instead of extending to T+10 + 10 = T+20, it MUST cap at forced_close_time (T+13m)
    assert rfq.current_close_time == rfq.forced_close_time

    # Attempting to bid after reaching or past forced close time MUST be rejected
    with pytest.raises(HTTPException) as exc_info:
        BritishAuctionEngine.submit_quotation(
            db_session, rfq.id, s1,
            QuotationCreate(carrier_name="C1", freight_charges=8000, origin_charges=1000, destination_charges=1000, transit_time="2d", quote_validity="10d"),
            submission_time=rfq.forced_close_time + timedelta(seconds=1)
        )
    assert exc_info.value.status_code == 400
