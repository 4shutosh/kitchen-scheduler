"""Order creation, retrieval, and order item status flow tests."""
import pytest


@pytest.fixture
def setup(client):
    """Returns (customer_id, menu_item_id) ready for ordering."""
    station = client.post("/stations/", json={"name": "Grill"}).json()
    menu = client.post("/menus/", json={"name": "Main"}).json()
    item = client.post("/menu-items/", json={
        "name": "Cake Slice", "station_id": station["id"], "menu_id": menu["id"],
        "price": 550.0, "prep_time": 5, "category": "Dessert", "availability": "available"
    }).json()
    customer = client.post("/customers/", json={"email": "guest@example.com", "name": "Guest", "paid": 1100}).json()
    return customer["id"], item["id"], station["id"]


# --- Order Creation ---

def test_create_order_dine_in(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["order_type"] == "dine_in"
    assert data["status"] == "pending"
    assert data["customer_id"] == cid
    assert len(data["order_items"]) == 1
    assert data["order_items"][0]["quantity"] == 1
    assert data["order_items"][0]["status"] == "todo"


def test_create_order_parcel(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "parcel", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 2}]
    })
    assert res.status_code == 201
    assert res.json()["order_type"] == "parcel"


def test_create_order_multiple_items(client, setup):
    cid, iid, sid = setup
    menu = client.post("/menus/", json={"name": "M2"}).json()
    item2 = client.post("/menu-items/", json={
        "name": "Drink", "station_id": sid, "menu_id": menu["id"],
        "price": 200.0, "prep_time": 2, "category": "Drinks"
    }).json()
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}, {"menu_item_id": item2["id"], "quantity": 2}]
    })
    assert res.status_code == 201
    assert len(res.json()["order_items"]) == 2


def test_create_order_with_out_of_plan_flag(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid, "is_out_of_plan": True,
        "order_items": [{"menu_item_id": iid, "quantity": 5}]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["is_out_of_plan"] is True
    assert all(i["is_out_of_plan"] for i in data["order_items"])


def test_create_order_without_out_of_plan_flag_defaults_false(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    assert res.json()["is_out_of_plan"] is False


def test_create_order_enriches_customer(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    # GET /orders includes customer info
    orders = client.get("/orders/").json()
    assert orders[0]["customer"]["name"] == "Guest"


def test_create_order_enriches_menu_items(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    order = client.get(f"/orders/{res.json()['id']}").json()
    assert order["order_items"][0]["menu_item"]["name"] == "Cake Slice"


def test_create_order_invalid_order_type(client, setup):
    cid, iid, _ = setup
    res = client.post("/orders/", json={
        "order_type": "delivery", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    assert res.status_code == 422


def test_get_nonexistent_order(client):
    assert client.get("/orders/99999").status_code == 404


# --- Order Item Status Flow ---

def test_order_item_status_todo_to_inprogress(client, setup):
    cid, iid, _ = setup
    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    }).json()
    item_id = order["order_items"][0]["id"]

    res = client.patch(f"/order-items/{item_id}/status", json={"status": "inprogress"})
    assert res.status_code == 200
    assert res.json()["status"] == "inprogress"


def test_order_status_becomes_in_progress_when_item_starts(client, setup):
    cid, iid, _ = setup
    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    }).json()
    item_id = order["order_items"][0]["id"]

    client.patch(f"/order-items/{item_id}/status", json={"status": "inprogress"})
    order_state = client.get(f"/orders/{order['id']}").json()
    assert order_state["status"] == "in_progress"


def test_order_status_becomes_completed_when_all_items_done(client, setup):
    cid, iid, _ = setup
    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    }).json()
    item_id = order["order_items"][0]["id"]

    client.patch(f"/order-items/{item_id}/status", json={"status": "inprogress"})
    client.patch(f"/order-items/{item_id}/status", json={"status": "done"})

    order_state = client.get(f"/orders/{order['id']}").json()
    assert order_state["status"] == "completed"


def test_order_status_goes_back_to_in_progress_if_item_reverted(client, setup):
    """If one item moves back from done, order goes back to in_progress."""
    cid, iid, sid = setup
    menu = client.post("/menus/", json={"name": "M"}).json()
    item2 = client.post("/menu-items/", json={
        "name": "Drink", "station_id": sid, "menu_id": menu["id"],
        "price": 200, "prep_time": 2, "category": "Drinks"
    }).json()

    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}, {"menu_item_id": item2["id"], "quantity": 1}]
    }).json()

    ids = [i["id"] for i in order["order_items"]]
    for oid in ids:
        client.patch(f"/order-items/{oid}/status", json={"status": "inprogress"})
        client.patch(f"/order-items/{oid}/status", json={"status": "done"})

    # Revert one back
    client.patch(f"/order-items/{ids[0]}/status", json={"status": "inprogress"})
    order_state = client.get(f"/orders/{order['id']}").json()
    assert order_state["status"] == "in_progress"


def test_update_nonexistent_order_item(client):
    res = client.patch("/order-items/99999/status", json={"status": "inprogress"})
    assert res.status_code == 404


def test_invalid_order_item_status(client, setup):
    cid, iid, _ = setup
    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    }).json()
    item_id = order["order_items"][0]["id"]
    res = client.patch(f"/order-items/{item_id}/status", json={"status": "flying"})
    assert res.status_code == 422


# --- Station Order Items View ---

def test_get_order_items_by_station(client, setup):
    cid, iid, sid = setup
    client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    res = client.get(f"/stations/{sid}/order-items/")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["menu_item"]["name"] == "Cake Slice"
    assert items[0]["order"]["order_type"] == "dine_in"


def test_get_order_items_by_station_filtered_by_status(client, setup):
    cid, iid, sid = setup
    order = client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    }).json()
    item_id = order["order_items"][0]["id"]

    todo_items = client.get(f"/stations/{sid}/order-items/", params={"status": "todo"}).json()
    assert len(todo_items) == 1

    client.patch(f"/order-items/{item_id}/status", json={"status": "inprogress"})

    todo_items = client.get(f"/stations/{sid}/order-items/", params={"status": "todo"}).json()
    assert len(todo_items) == 0

    inprogress_items = client.get(f"/stations/{sid}/order-items/", params={"status": "inprogress"}).json()
    assert len(inprogress_items) == 1


def test_order_item_includes_customer_info(client, setup):
    cid, iid, sid = setup
    client.post("/orders/", json={
        "order_type": "dine_in", "customer_id": cid,
        "order_items": [{"menu_item_id": iid, "quantity": 1}]
    })
    items = client.get(f"/stations/{sid}/order-items/").json()
    assert items[0]["order"]["customer"]["name"] == "Guest"
