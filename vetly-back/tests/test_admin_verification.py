"""Admin approval of vet registrations: access control and the verification flow."""
import uuid

import pytest
from sqlalchemy import select

from app.core.security import create_access_token, get_password_hash
from app.db.base import Vet

ADMIN_EMAIL = "vet@test.com"  # the email used by the registered_vet fixture


@pytest.fixture()
def admin_env(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", f" Other@x.com , {ADMIN_EMAIL.upper()} ")


@pytest.fixture()
def pending_vet(db):
    vet = Vet(
        email="newvet@test.com",
        password_hash=get_password_hash("test123456"),
        name="Dr New",
        slug=f"dr-new-{uuid.uuid4().hex[:6]}",
        specialty="Surgery",
        license_number="VET-NEW-999",
        phone="6900000002",
        address="Athens 1",
        city="Patra",
        is_verified=False,
        email_verified=True,
    )
    db.add(vet)
    db.commit()
    db.refresh(vet)
    return vet


def login(client, email):
    return client.post("/api/v1/auth/vet/login", json={"email": email, "password": "test123456"})


def test_anonymous_gets_401(client):
    assert client.get("/api/v1/admin/vets/pending").status_code == 401


def test_non_admin_vet_gets_403(client, vet_auth_header, pending_vet, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", "")
    assert client.get("/api/v1/admin/vets/pending", headers=vet_auth_header).status_code == 403
    response = client.post(f"/api/v1/admin/vets/{pending_vet.id}/approve", headers=vet_auth_header)
    assert response.status_code == 403
    assert pending_vet.is_verified is False


def test_pet_owner_gets_401(client, owner_auth_header, admin_env):
    assert client.get("/api/v1/admin/vets/pending", headers=owner_auth_header).status_code == 401


def test_unverified_vet_in_admin_list_cannot_use_admin(client, db, registered_vet, vet_auth_header, admin_env):
    registered_vet.is_verified = False
    db.commit()
    assert client.get("/api/v1/admin/vets/pending", headers=vet_auth_header).status_code == 403


def test_admin_lists_pending_vets(client, vet_auth_header, pending_vet, admin_env):
    response = client.get("/api/v1/admin/vets/pending", headers=vet_auth_header)
    assert response.status_code == 200, response.text
    body = response.json()
    row = next(item for item in body["items"] if item["id"] == str(pending_vet.id))
    assert row["license_number"] == "VET-NEW-999"
    assert row["email_verified"] is True and row["is_verified"] is False
    assert all(item["is_verified"] is False for item in body["items"])
    assert body["total"] == len(body["items"])


def test_approve_lets_vet_sign_in(client, db, vet_auth_header, pending_vet, admin_env):
    assert login(client, pending_vet.email).status_code == 403
    response = client.post(f"/api/v1/admin/vets/{pending_vet.id}/approve", headers=vet_auth_header)
    assert response.status_code == 200, response.text
    assert response.json()["is_verified"] is True
    db.refresh(pending_vet)
    assert pending_vet.is_verified is True
    assert login(client, pending_vet.email).status_code == 200
    pending = client.get("/api/v1/admin/vets/pending", headers=vet_auth_header).json()["items"]
    assert str(pending_vet.id) not in {item["id"] for item in pending}


def test_cannot_approve_vet_with_unconfirmed_email(client, db, vet_auth_header, pending_vet, admin_env):
    pending_vet.email_verified = False
    db.commit()
    response = client.post(f"/api/v1/admin/vets/{pending_vet.id}/approve", headers=vet_auth_header)
    assert response.status_code == 400
    db.refresh(pending_vet)
    assert pending_vet.is_verified is False


def test_reject_removes_unapproved_registration(client, db, vet_auth_header, pending_vet, admin_env):
    vet_id = pending_vet.id
    response = client.post(f"/api/v1/admin/vets/{vet_id}/reject", headers=vet_auth_header)
    assert response.status_code == 204
    db.expire_all()
    assert db.scalar(select(Vet).where(Vet.id == vet_id)) is None
    assert login(client, "newvet@test.com").status_code == 401


def test_reject_refuses_approved_vet(client, db, vet_auth_header, pending_vet, admin_env):
    pending_vet.is_verified = True
    db.commit()
    assert client.post(f"/api/v1/admin/vets/{pending_vet.id}/reject", headers=vet_auth_header).status_code == 409


def test_revoke_blocks_sign_in_again(client, db, vet_auth_header, pending_vet, admin_env):
    pending_vet.is_verified = True
    db.commit()
    assert login(client, pending_vet.email).status_code == 200
    response = client.post(f"/api/v1/admin/vets/{pending_vet.id}/revoke", headers=vet_auth_header)
    assert response.status_code == 200 and response.json()["is_verified"] is False
    assert login(client, pending_vet.email).status_code == 403


def test_admin_cannot_revoke_self(client, registered_vet, vet_auth_header, admin_env):
    assert client.post(f"/api/v1/admin/vets/{registered_vet.id}/revoke", headers=vet_auth_header).status_code == 400


def test_unknown_vet_is_404(client, vet_auth_header, admin_env):
    assert client.post(f"/api/v1/admin/vets/{uuid.uuid4()}/approve", headers=vet_auth_header).status_code == 404


def test_empty_admin_setting_means_nobody(client, vet_auth_header, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", "")
    assert client.get("/api/v1/admin/vets/pending", headers=vet_auth_header).status_code == 403
