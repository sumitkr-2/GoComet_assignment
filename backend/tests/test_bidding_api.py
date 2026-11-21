from datetime import datetime, timedelta
from fastapi import status
from app.models.rfq import RFQ, RFQStatus, AuctionConfiguration, ExtensionTriggerType
from app.core.security import create_access_token

def test_full_bidding_workflow(client, db_session, buyer_user, suppliers):
    now = datetime.utcnow()
    rfq = RFQ(
        reference_id="RFQ-E2E-001",
        name="E2E Freight Mumbai to Delhi",
        buyer_id=buyer_user.id,
        bid_start_time=now - timedelta(minutes=10),
        original_close_time=now + timedelta(minutes=5),
        current_close_time=now + timedelta(minutes=5),
        forced_close_time=now + timedelta(minutes=15),
        pickup_service_date=now + timedelta(days=2),
        status=RFQStatus.ACTIVE,
        created_at=now - timedelta(minutes=10)
    )
    db_session.add(rfq)
    db_session.flush()

    cfg = AuctionConfiguration(
        rfq_id=rfq.id,
        british_auction_enabled=True,
        trigger_window_minutes=5.0,
        extension_duration_minutes=3.0,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    )
    db_session.add(cfg)
    db_session.commit()

    s1_user, s1_profile = suppliers[0]
    s2_user, s2_profile = suppliers[1]
    token1 = create_access_token(subject=s1_user.id)
    token2 = create_access_token(subject=s2_user.id)

    # 1. Supplier 1 submits quote
    quote_payload = {
        "carrier_name": "BlueDart Cargo",
        "freight_charges": 25000.0,
        "origin_charges": 3000.0,
        "destination_charges": 2000.0,
        "transit_time": "2 Days",
        "quote_validity": "15 Days"
    }
    r1 = client.post(
        f"/api/rfqs/{rfq.id}/bids",
        json=quote_payload,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert r1.status_code == status.HTTP_201_CREATED
    d1 = r1.json()
    assert d1["quotation"]["total_amount"] == 30000.0
    assert d1["rank"] == "L1"
    assert d1["is_l1"] is True
    assert d1["auction_extended"] is True # Inside 5m trigger window!
    assert d1["new_close_time"] is not None

    # 2. Supplier 1 attempts to submit HIGHER quote (Must be rejected)
    higher_quote = {
        "carrier_name": "BlueDart Cargo",
        "freight_charges": 30000.0,
        "origin_charges": 3000.0,
        "destination_charges": 2000.0,
        "transit_time": "2 Days",
        "quote_validity": "15 Days"
    }
    r_bad = client.post(
        f"/api/rfqs/{rfq.id}/bids",
        json=higher_quote,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert r_bad.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Supplier 2 submits lower quote to take L1
    s2_quote = {
        "carrier_name": "DHL Express",
        "freight_charges": 22000.0,
        "origin_charges": 2500.0,
        "destination_charges": 2000.0,
        "transit_time": "2 Days",
        "quote_validity": "15 Days"
    }
    r2 = client.post(
        f"/api/rfqs/{rfq.id}/bids",
        json=s2_quote,
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert r2.status_code == status.HTTP_201_CREATED
    d2 = r2.json()
    assert d2["quotation"]["total_amount"] == 26500.0
    assert d2["rank"] == "L1"
    assert d2["is_l1"] is True

    # 4. Check Rankings API
    rank_resp = client.get(
        f"/api/rfqs/{rfq.id}/rankings",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert rank_resp.status_code == status.HTTP_200_OK
    rank_data = rank_resp.json()
    assert rank_data["total_suppliers"] == 2
    assert rank_data["current_lowest_bid"] == 26500.0
    assert rank_data["rankings"][0]["supplier_id"] == s2_profile.id
    assert rank_data["rankings"][0]["rank"] == "L1"
    assert rank_data["rankings"][1]["supplier_id"] == s1_profile.id
    assert rank_data["rankings"][1]["rank"] == "L2"

    # 5. Check Activity Logs API
    act_resp = client.get(
        f"/api/rfqs/{rfq.id}/activity",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert act_resp.status_code == status.HTTP_200_OK
    logs = act_resp.json()
    event_types = [l["event_type"] for l in logs]
    assert "AUCTION_EXTENDED" in event_types
    assert "BID_SUBMITTED" in event_types
    assert "RANKING_CHANGED" in event_types

    # 6. Check Dashboard Stats API
    dash_resp = client.get(
        "/api/dashboard/stats",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert dash_resp.status_code == status.HTTP_200_OK
    dash_data = dash_resp.json()
    assert dash_data["total_auctions"] >= 1
    assert dash_data["total_submitted_bids"] >= 2
