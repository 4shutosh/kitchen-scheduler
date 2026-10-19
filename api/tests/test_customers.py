"""Customer CRUD tests."""
import pytest


CUSTOMER = {"email": "test@example.com", "name": "Test User", "phone_number": "9999999999", "plan_type": "Single ticket", "paid": 550}


def create_customer(client, data=None):
    return client.post("/customers/", json=data or CUSTOMER)


# --- Create ---

def test_create_customer(client):
    res = create_customer(client)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == CUSTOMER["email"]
    assert data["name"] == CUSTOMER["name"]
    assert data["paid"] == 550
    assert "id" in data
    assert "created_at" in data


def test_create_customer_minimal(client):
    res = client.post("/customers/", json={"email": "min@example.com", "name": "Min User"})
    assert res.status_code == 201
    data = res.json()
    assert data["paid"] == 0
    assert data["phone_number"] is None


def test_create_customer_without_email(client):
    res = client.post("/customers/", json={"name": "No Email", "phone_number": "9999999999"})
    assert res.status_code == 201
    assert res.json()["email"] is None


def test_create_customer_missing_name(client):
    res = client.post("/customers/", json={"email": "noname@example.com"})
    assert res.status_code == 422


def test_create_multiple_customers_same_email(client):
    """Duplicate emails are allowed — multiple ticket purchases."""
    create_customer(client)
    res = create_customer(client)
    assert res.status_code == 201


def test_create_customer_with_large_paid_amount(client):
    res = client.post("/customers/", json={"email": "big@example.com", "name": "Big Spender", "paid": 9900})
    assert res.status_code == 201
    assert res.json()["paid"] == 9900


# --- Read ---

def test_get_all_customers_empty(client):
    res = client.get("/customers/")
    assert res.status_code == 200
    assert res.json() == []


def test_get_all_customers(client):
    create_customer(client)
    res = client.get("/customers/")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_customer_by_id(client):
    cid = create_customer(client).json()["id"]
    res = client.get(f"/customers/{cid}")
    assert res.status_code == 200
    assert res.json()["id"] == cid


def test_get_nonexistent_customer(client):
    res = client.get("/customers/99999")
    assert res.status_code == 404


# --- Update ---

def test_update_customer(client):
    cid = create_customer(client).json()["id"]
    res = client.put(f"/customers/{cid}", json={"paid": 1100, "plan_type": "2 tickets"})
    assert res.status_code == 200
    assert res.json()["paid"] == 1100
    assert res.json()["plan_type"] == "2 tickets"


def test_update_customer_partial(client):
    cid = create_customer(client).json()["id"]
    res = client.put(f"/customers/{cid}", json={"name": "Updated Name"})
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Name"
    assert res.json()["email"] == CUSTOMER["email"]  # unchanged


def test_update_nonexistent_customer(client):
    res = client.put("/customers/99999", json={"name": "Ghost"})
    assert res.status_code == 404


# --- Delete ---

def test_delete_customer(client):
    cid = create_customer(client).json()["id"]
    res = client.delete(f"/customers/{cid}")
    assert res.status_code == 200
    assert client.get(f"/customers/{cid}").status_code == 404


def test_delete_nonexistent_customer(client):
    res = client.delete("/customers/99999")
    assert res.status_code == 404


def test_delete_customer_removes_orders(client):
    """Deleting a customer cascades to their orders."""
    cid = create_customer(client).json()["id"]
    station = client.post("/stations/", json={"name": "Grill"}).json()
    menu = client.post("/menus/", json={"name": "Menu"}).json()
    item = client.post("/menu-items/", json={"name": "Cake", "station_id": station["id"], "menu_id": menu["id"], "price": 550, "prep_time": 5, "category": "Dessert"}).json()
    order_res = client.post("/orders/", json={"order_type": "dine_in", "customer_id": cid, "order_items": [{"menu_item_id": item["id"], "quantity": 1}]})
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    client.delete(f"/customers/{cid}")

    # Order should be gone
    res = client.get(f"/orders/{order_id}")
    assert res.status_code == 404


# --- Upsert ---

def test_upsert_creates_new_customer(client):
    res = client.post("/customers/upsert", json={"email": "new@example.com", "name": "New", "paid": 550})
    assert res.status_code == 200
    assert res.json()["email"] == "new@example.com"


def test_upsert_updates_existing_by_email(client):
    client.post("/customers/upsert", json={"email": "u@example.com", "name": "Original", "paid": 550})
    res = client.post("/customers/upsert", json={"email": "u@example.com", "name": "Updated", "paid": 1100})
    assert res.status_code == 200
    assert res.json()["name"] == "Updated"
    assert res.json()["paid"] == 1100
    # Should still be one record for that email (from getAll)
    all_customers = client.get("/customers/").json()
    same_email = [c for c in all_customers if c["email"] == "u@example.com"]
    assert len(same_email) == 1
