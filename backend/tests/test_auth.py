from fastapi import status

def test_register_and_login(client):
    # Test register supplier
    reg_resp = client.post("/api/auth/register", json={
        "name": "New Logistics",
        "email": "new_supplier@example.com",
        "password": "Password@123",
        "role": "SUPPLIER",
        "company_name": "New Logistics Inc.",
        "contact_phone": "+91 99999 88888"
    })
    assert reg_resp.status_code == status.HTTP_201_CREATED
    data = reg_resp.json()
    assert "access_token" in data
    assert data["role"] == "SUPPLIER"
    assert data["company_name"] == "New Logistics Inc."

    # Test login
    login_resp = client.post("/api/auth/login", json={
        "email": "new_supplier@example.com",
        "password": "Password@123"
    })
    assert login_resp.status_code == status.HTTP_200_OK
    token = login_resp.json()["access_token"]

    # Test /api/auth/me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.json()["email"] == "new_supplier@example.com"
