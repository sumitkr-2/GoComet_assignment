from datetime import datetime, timedelta
from fastapi import status

def test_create_valid_rfq(client, buyer_token):
    now = datetime.utcnow()
    payload = {
        "name": "Test RFQ 1",
        "reference_id": "RFQ-T-001",
        "bid_start_time": (now - timedelta(minutes=1)).isoformat(),
        "bid_close_time": (now + timedelta(hours=1)).isoformat(),
        "forced_close_time": (now + timedelta(hours=2)).isoformat(),
        "pickup_service_date": (now + timedelta(days=2)).isoformat(),
        "british_auction_enabled": True,
        "trigger_window_minutes": 10.0,
        "extension_duration_minutes": 5.0,
        "extension_trigger_type": "BID_RECEIVED"
    }
    resp = client.post("/api/rfqs", json=payload, headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert data["reference_id"] == "RFQ-T-001"
    assert data["status"] == "ACTIVE"
    assert data["auction_config"]["trigger_window_minutes"] == 10.0

def test_create_rfq_invalid_times(client, buyer_token):
    now = datetime.utcnow()
    # Close before start
    payload = {
        "name": "Bad RFQ",
        "reference_id": "RFQ-BAD-01",
        "bid_start_time": (now + timedelta(hours=2)).isoformat(),
        "bid_close_time": (now + timedelta(hours=1)).isoformat(),
        "forced_close_time": (now + timedelta(hours=3)).isoformat(),
        "pickup_service_date": (now + timedelta(days=2)).isoformat(),
        "trigger_window_minutes": 10.0,
        "extension_duration_minutes": 5.0,
        "extension_trigger_type": "BID_RECEIVED"
    }
    resp = client.post("/api/rfqs", json=payload, headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Forced close earlier than close
    payload["bid_start_time"] = (now).isoformat()
    payload["bid_close_time"] = (now + timedelta(hours=2)).isoformat()
    payload["forced_close_time"] = (now + timedelta(hours=1)).isoformat()
    resp2 = client.post("/api/rfqs", json=payload, headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp2.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_supplier_cannot_create_rfq(client, suppliers):
    supp_user, _ = suppliers[0]
    from app.core.security import create_access_token
    token = create_access_token(subject=supp_user.id)
    
    now = datetime.utcnow()
    payload = {
        "name": "Hacked RFQ",
        "reference_id": "RFQ-HACK-01",
        "bid_start_time": (now).isoformat(),
        "bid_close_time": (now + timedelta(hours=1)).isoformat(),
        "forced_close_time": (now + timedelta(hours=2)).isoformat(),
        "pickup_service_date": (now + timedelta(days=2)).isoformat(),
        "trigger_window_minutes": 10.0,
        "extension_duration_minutes": 5.0,
        "extension_trigger_type": "BID_RECEIVED"
    }
    resp = client.post("/api/rfqs", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == status.HTTP_403_FORBIDDEN
