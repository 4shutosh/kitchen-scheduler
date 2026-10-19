"""Auth endpoint tests — login, logout, verify."""
import pytest
from main import _valid_tokens, ADMIN_USERNAME, ADMIN_PASSWORD


@pytest.fixture(autouse=True)
def clear_tokens():
    _valid_tokens.clear()
    yield
    _valid_tokens.clear()


def test_login_success(client):
    res = client.post("/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert len(data["token"]) == 64  # secrets.token_hex(32)


def test_login_wrong_password(client):
    res = client.post("/auth/login", json={"username": ADMIN_USERNAME, "password": "wrong"})
    assert res.status_code == 401


def test_login_wrong_username(client):
    res = client.post("/auth/login", json={"username": "nobody", "password": ADMIN_PASSWORD})
    assert res.status_code == 401


def test_login_empty_credentials(client):
    res = client.post("/auth/login", json={"username": "", "password": ""})
    assert res.status_code == 401


def test_verify_valid_token(client):
    token = client.post("/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}).json()["token"]
    res = client.get("/auth/verify", params={"token": token})
    assert res.status_code == 200
    assert res.json()["valid"] is True


def test_verify_invalid_token(client):
    res = client.get("/auth/verify", params={"token": "fakefakefake"})
    assert res.status_code == 401


def test_logout_invalidates_token(client):
    token = client.post("/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}).json()["token"]
    client.post("/auth/logout", json={"token": token})
    res = client.get("/auth/verify", params={"token": token})
    assert res.status_code == 401


def test_each_login_produces_unique_token(client):
    creds = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    t1 = client.post("/auth/login", json=creds).json()["token"]
    t2 = client.post("/auth/login", json=creds).json()["token"]
    assert t1 != t2
