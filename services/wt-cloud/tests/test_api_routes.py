import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert "DPDP" in data["privacy_compliance"]


def test_memory_lookup(client):
    resp = client.get("/api/v1/memory/lookup?symbol=PaymentReconciler.ts")
    assert resp.status_code == 200
    cards = resp.json()
    assert len(cards) >= 1
    assert "PaymentReconciler.ts" in cards[0]["ast_symbol_path"]
    assert cards[0]["ticket_key"] == "PAY-1082"


def test_executive_pack(client):
    resp = client.get("/api/v1/dashboard/executive-pack")
    assert resp.status_code == 200
    data = resp.json()
    assert "Swiggy" in data["organization"]
    assert len(data["squads"]) >= 1
    assert len(data["scope_drift_events"]) >= 1


def test_convert_to_billed_cr(client):
    exec_pack = client.get("/api/v1/dashboard/executive-pack").json()
    drift_id = exec_pack["scope_drift_events"][0]["drift_id"]

    resp = client.post("/api/v1/crv/convert-cr", json={"drift_id": drift_id, "billed_hourly_rate": 1500})
    assert resp.status_code == 200
    cr_data = resp.json()
    assert cr_data["status"] == "CONVERTED"
    assert "CR-2026-" in cr_data["change_request_number"]
    assert cr_data["billed_amount_inr"] > 0


def test_virtual_predecessor_chat(client):
    resp = client.post("/api/v1/autokt/chat", json={"query": "Why do we have a 500ms delay in settlement?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "500ms" in data["answer"]
