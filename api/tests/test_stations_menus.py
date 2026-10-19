"""Station and Menu CRUD tests."""
import pytest


# --- Stations ---

def test_create_station(client):
    res = client.post("/stations/", json={"name": "Grill", "description": "Hot grill station"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Grill"
    assert data["description"] == "Hot grill station"
    assert "id" in data


def test_create_station_minimal(client):
    res = client.post("/stations/", json={"name": "Bar"})
    assert res.status_code == 201


def test_create_station_missing_name(client):
    res = client.post("/stations/", json={"description": "No name"})
    assert res.status_code == 422


def test_get_all_stations_empty(client):
    assert client.get("/stations/").json() == []


def test_get_all_stations(client):
    client.post("/stations/", json={"name": "Grill"})
    client.post("/stations/", json={"name": "Bar"})
    res = client.get("/stations/")
    assert len(res.json()) == 2


def test_get_station_by_id(client):
    sid = client.post("/stations/", json={"name": "Pastry"}).json()["id"]
    res = client.get(f"/stations/{sid}")
    assert res.status_code == 200
    assert res.json()["name"] == "Pastry"


def test_get_nonexistent_station(client):
    assert client.get("/stations/99999").status_code == 404


def test_update_station(client):
    sid = client.post("/stations/", json={"name": "Old"}).json()["id"]
    res = client.put(f"/stations/{sid}", json={"name": "New", "description": "Updated"})
    assert res.status_code == 200
    assert res.json()["name"] == "New"


def test_delete_station(client):
    sid = client.post("/stations/", json={"name": "Temp"}).json()["id"]
    res = client.delete(f"/stations/{sid}")
    assert res.status_code == 200
    assert client.get(f"/stations/{sid}").status_code == 404


def test_delete_station_cascades_menu_items(client):
    station = client.post("/stations/", json={"name": "Drinks"}).json()
    menu = client.post("/menus/", json={"name": "Drinks Menu"}).json()
    item = client.post("/menu-items/", json={
        "name": "Juice", "station_id": station["id"], "menu_id": menu["id"],
        "price": 100, "prep_time": 2, "category": "Drinks"
    }).json()

    res = client.delete(f"/stations/{station['id']}")
    assert res.status_code == 200
    assert res.json()["menu_items_count"] == 1

    # Menu item should be gone
    assert client.get(f"/menu-items/{item['id']}").status_code == 404


def test_delete_nonexistent_station(client):
    assert client.delete("/stations/99999").status_code == 404


# --- Menus ---

def test_create_menu(client):
    res = client.post("/menus/", json={"name": "Lunch Menu", "description": "Weekend lunch"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Lunch Menu"


def test_create_menu_missing_name(client):
    res = client.post("/menus/", json={"description": "No name"})
    assert res.status_code == 422


def test_get_all_menus(client):
    client.post("/menus/", json={"name": "A"})
    client.post("/menus/", json={"name": "B"})
    assert len(client.get("/menus/").json()) == 2


def test_get_menu_by_id(client):
    mid = client.post("/menus/", json={"name": "Test"}).json()["id"]
    assert client.get(f"/menus/{mid}").status_code == 200


def test_get_nonexistent_menu(client):
    assert client.get("/menus/99999").status_code == 404


def test_update_menu(client):
    mid = client.post("/menus/", json={"name": "Old"}).json()["id"]
    res = client.put(f"/menus/{mid}", json={"name": "New"})
    assert res.status_code == 200
    assert res.json()["name"] == "New"


def test_delete_menu(client):
    mid = client.post("/menus/", json={"name": "Delete Me"}).json()["id"]
    assert client.delete(f"/menus/{mid}").status_code == 200
    assert client.get(f"/menus/{mid}").status_code == 404


# --- Menu Items ---

def _setup(client):
    station = client.post("/stations/", json={"name": "Grill"}).json()
    menu = client.post("/menus/", json={"name": "Main"}).json()
    return station["id"], menu["id"]


def test_create_menu_item(client):
    sid, mid = _setup(client)
    res = client.post("/menu-items/", json={
        "name": "Burger", "station_id": sid, "menu_id": mid,
        "price": 299.0, "prep_time": 10, "category": "Mains", "availability": "available"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Burger"
    assert data["price"] == 299.0


def test_create_menu_item_missing_name(client):
    sid, mid = _setup(client)
    res = client.post("/menu-items/", json={"station_id": sid, "menu_id": mid, "price": 100, "prep_time": 5, "category": "X"})
    assert res.status_code == 422


def test_get_menu_items_by_menu(client):
    sid, mid = _setup(client)
    client.post("/menu-items/", json={"name": "Item A", "station_id": sid, "menu_id": mid, "price": 100, "prep_time": 5, "category": "X"})
    client.post("/menu-items/", json={"name": "Item B", "station_id": sid, "menu_id": mid, "price": 200, "prep_time": 5, "category": "X"})
    res = client.get(f"/menus/{mid}/menu-items/")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_update_menu_item_availability(client):
    sid, mid = _setup(client)
    iid = client.post("/menu-items/", json={"name": "Cake", "station_id": sid, "menu_id": mid, "price": 150, "prep_time": 3, "category": "Dessert"}).json()["id"]
    res = client.put(f"/menu-items/{iid}", json={"availability": "sold_out"})
    assert res.status_code == 200
    assert res.json()["availability"] == "sold_out"


def test_delete_menu_item(client):
    sid, mid = _setup(client)
    iid = client.post("/menu-items/", json={"name": "Temp", "station_id": sid, "menu_id": mid, "price": 50, "prep_time": 1, "category": "X"}).json()["id"]
    assert client.delete(f"/menu-items/{iid}").status_code == 200
    assert client.get(f"/menu-items/{iid}").status_code == 404


def test_get_nonexistent_menu_item(client):
    assert client.get("/menu-items/99999").status_code == 404
