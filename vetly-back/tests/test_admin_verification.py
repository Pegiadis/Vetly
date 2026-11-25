"""Admin panel: sign-in, access control, vet verification, owner accounts and the overview."""
import uuid
from datetime import datetime

import pytest
from sqlalchemy import select

from app.core.security import create_access_token, get_password_hash
from app.db.base import Pet, PetOwner, Vet
from app.models.pet import PetType
from tests.conftest import ADMIN_PASSWORD, OWNER_DATA

API = "/api/v1/admin"


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


def vet_login(client, email):
    return client.post("/api/v1/auth/vet/login", json={"email": email, "password": "test123456"})


def owner_login(client):
    return client.post("/api/v1/auth/pet-owner/login", json={"email": OWNER_DATA["email"], "password": OWNER_DATA["password"]})


# --- sign-in and access ---

def test_admin_signs_in_and_reads_own_profile(client, db, admin):
    response = client.post(f"{API}/login", json={"email": admin.email.upper(), "password": ADMIN_PASSWORD})
    assert response.status_code == 200, response.text
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    me = client.get(f"{API}/me", headers=headers).json()
    assert me["email"] == admin.email and "password_hash" not in me
    db.refresh(admin)
    assert admin.last_login_at is not None


@pytest.mark.parametrize("email, password", [("nobody@example.com", ADMIN_PASSWORD), (None, "wrong-password-1")])
def test_bad_admin_sign_in_is_401(client, admin, email, password):
    response = client.post(f"{API}/login", json={"email": email or admin.email, "password": password})
    assert response.status_code == 401


def test_vet_credentials_do_not_open_the_admin_panel(client, registered_vet):
    assert client.post(f"{API}/login", json={"email": registered_vet.email, "password": "test123456"}).status_code == 401


@pytest.mark.parametrize("path", ["/overview", "/vets", "/owners", "/me"])
def test_only_admin_tokens_are_accepted(client, vet_auth_header, owner_auth_header, path):
    assert client.get(f"{API}{path}").status_code == 401
    assert client.get(f"{API}{path}", headers=vet_auth_header).status_code == 401
    assert client.get(f"{API}{path}", headers=owner_auth_header).status_code == 401


def test_admin_token_is_not_a_vet_or_owner_session(client, admin_auth_header):
    assert client.get("/api/v1/auth/me", headers=admin_auth_header).status_code == 401
    assert client.get("/api/v1/auth/pet-owner/me", headers=admin_auth_header).status_code == 401


def test_password_reset_from_command_line_ends_sessions(client, db, admin, admin_auth_header):
    admin.auth_version += 1
    db.commit()
    assert client.get(f"{API}/me", headers=admin_auth_header).status_code == 401


def test_vet_me_no_longer_has_admin_flag(client, vet_auth_header):
    assert "is_admin" not in client.get("/api/v1/auth/me", headers=vet_auth_header).json()


# --- vets ---

def test_vet_list_filters_and_counts(client, admin_auth_header, registered_vet, pending_vet):
    suspended = client.get(f"{API}/vets", params={"status": "suspended"}, headers=admin_auth_header).json()
    row = next(item for item in suspended["items"] if item["id"] == str(pending_vet.id))
    assert row["status"] == "suspended" and row["license_number"] == "VET-NEW-999"
    assert row["appointments_count"] == 0 and row["clients_count"] == 0
    assert all(item["status"] == "suspended" for item in suspended["items"])

    found = client.get(f"{API}/vets", params={"q": "vet-test-123"}, headers=admin_auth_header).json()
    assert [item["id"] for item in found["items"]] == [str(registered_vet.id)]
    assert found["items"][0]["status"] == "active"


def test_unknown_status_filter_is_rejected(client, admin_auth_header):
    assert client.get(f"{API}/vets", params={"status": "pending"}, headers=admin_auth_header).status_code == 422


def test_approval_endpoints_are_gone(client, admin_auth_header, pending_vet):
    for action in ("approve", "revoke", "reject"):
        assert client.post(f"{API}/vets/{pending_vet.id}/{action}", headers=admin_auth_header).status_code == 404


def test_suspend_blocks_sign_in_and_open_sessions_and_reactivate_restores(client, admin_auth_header, registered_vet, vet_auth_header):
    response = client.post(f"{API}/vets/{registered_vet.id}/suspend", headers=admin_auth_header)
    assert response.status_code == 200 and response.json()["status"] == "suspended"
    blocked = vet_login(client, registered_vet.email)
    assert blocked.status_code == 403 and "ανενεργός" in blocked.json()["detail"]
    assert client.get("/api/v1/auth/me", headers=vet_auth_header).status_code == 403

    response = client.post(f"{API}/vets/{registered_vet.id}/reactivate", headers=admin_auth_header)
    assert response.status_code == 200 and response.json()["status"] == "active"
    assert vet_login(client, registered_vet.email).status_code == 200


def test_unknown_vet_is_404(client, admin_auth_header):
    assert client.post(f"{API}/vets/{uuid.uuid4()}/suspend", headers=admin_auth_header).status_code == 404


# --- owners ---

def test_owner_list_shows_accounts_without_pet_details(client, db, admin_auth_header, registered_owner):
    db.add(Pet(pet_owner_id=registered_owner.id, name="Μπέλα", type=PetType.DOG))
    db.add(Pet(pet_owner_id=registered_owner.id, name="Παλιό", type=PetType.CAT, deleted_at=datetime.utcnow()))
    clinic_only = PetOwner(name="Clinic Only Client")  # no email or password: not an account
    db.add(clinic_only)
    db.commit()

    body = client.get(f"{API}/owners", params={"q": OWNER_DATA["email"]}, headers=admin_auth_header).json()
    assert body["total"] == 1
    row = body["items"][0]
    assert row["status"] == "active" and row["pets_count"] == 1 and row["appointments_count"] == 0
    assert "pets" not in row and "address" not in row

    everyone = client.get(f"{API}/owners", params={"q": "Clinic Only"}, headers=admin_auth_header).json()
    assert everyone["total"] == 0


def test_suspend_blocks_owner_and_reactivate_restores(client, db, admin_auth_header, registered_owner, owner_auth_header):
    assert owner_login(client).status_code == 200

    response = client.post(f"{API}/owners/{registered_owner.id}/suspend", headers=admin_auth_header)
    assert response.status_code == 200 and response.json()["status"] == "suspended"
    assert client.get("/api/v1/auth/pet-owner/me", headers=owner_auth_header).status_code == 401  # signed out
    blocked = owner_login(client)
    assert blocked.status_code == 403 and "ανασταλεί" in blocked.json()["detail"]
    db.refresh(registered_owner)
    fresh = create_access_token(str(registered_owner.id), token_type="pet_owner", version=registered_owner.auth_version)
    assert client.get("/api/v1/auth/pet-owner/me", headers={"Authorization": f"Bearer {fresh}"}).status_code == 403

    suspended = client.get(f"{API}/owners", params={"status": "suspended"}, headers=admin_auth_header).json()
    assert str(registered_owner.id) in {item["id"] for item in suspended["items"]}

    response = client.post(f"{API}/owners/{registered_owner.id}/reactivate", headers=admin_auth_header)
    assert response.status_code == 200 and response.json()["status"] == "active"
    assert owner_login(client).status_code == 200


def test_suspending_unknown_owner_is_404(client, admin_auth_header):
    assert client.post(f"{API}/owners/{uuid.uuid4()}/suspend", headers=admin_auth_header).status_code == 404


# --- overview ---

def test_overview_counts_and_eight_weeks(client, admin_auth_header, pending_vet, registered_owner):
    body = client.get(f"{API}/overview", headers=admin_auth_header).json()
    assert body["vets"]["suspended"] >= 1 and body["owners"]["total"] >= 1
    assert len(body["weeks"]) == 8
    starts = [row["week_start"] for row in body["weeks"]]
    assert starts == sorted(starts)
    assert body["weeks"][-1]["vets"] >= 1 and body["weeks"][-1]["owners"] >= 1
