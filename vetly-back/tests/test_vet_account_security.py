"""Vet session revocation, single-use reset links, account-enumeration-safe registration."""
import pytest
from sqlalchemy import select

from app.core.security import (
    create_access_token, create_password_reset_token, get_password_hash, verify_password,
)
from app.db.base import PetOwner, Vet
from tests.conftest import OWNER_DATA, VET_DATA

API = "/api/v1"


@pytest.fixture()
def sent(monkeypatch):
    """Record every email instead of sending it."""
    box = []
    monkeypatch.setattr("app.core.email.send_email", lambda to, subject, html: box.append((to, subject, html)))
    return box


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def vet_token_for(vet):
    return create_access_token(subject=str(vet.id), token_type="vet", version=vet.auth_version)


def vet_payload(**over):
    data = dict(VET_DATA, email="new-vet@example.com", license_number="LIC-NEW-1")
    data.update(over)
    return data


# --- session versions ---

def test_vet_login_token_carries_version_and_stale_is_rejected(client, db, registered_vet):
    resp = client.post(f"{API}/auth/vet/login", json={"email": VET_DATA["email"], "password": VET_DATA["password"]})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert client.get(f"{API}/auth/me", headers=bearer(token)).status_code == 200
    registered_vet.auth_version += 1
    db.commit()
    assert client.get(f"{API}/auth/me", headers=bearer(token)).status_code == 401
    assert client.get(f"{API}/vets", headers=bearer(token)).status_code == 401  # get_current_user path


def test_verify_email_token_uses_vet_version(client, db):
    from app.core.security import create_email_verification_token
    vet = Vet(email="v@example.com", password_hash=get_password_hash("password1"), name="V", slug="v-slug",
              specialty="x", license_number="L-1", phone="1", address="a", city="c", auth_version=3)
    db.add(vet)
    db.commit()
    resp = client.post(f"{API}/auth/verify-email", json={"token": create_email_verification_token(str(vet.id), "vet")})
    assert resp.status_code == 200
    assert client.get(f"{API}/auth/me", headers=bearer(resp.json()["access_token"])).status_code in (200, 403)
    from app.core.security import decode_token
    assert decode_token(resp.json()["access_token"]).version == 3


# --- password reset ---

def test_vet_reset_link_is_single_use(client, db, registered_vet):
    token = create_password_reset_token(str(registered_vet.id), "vet", version=registered_vet.auth_version)
    first = client.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "brandnew123", "user_type": "vet"})
    assert first.status_code == 200
    assert client.get(f"{API}/auth/me", headers=bearer(first.json()["access_token"])).status_code == 200
    again = client.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "another1234", "user_type": "vet"})
    assert again.status_code == 400
    db.refresh(registered_vet)
    assert verify_password("brandnew123", registered_vet.password_hash)


def test_reset_revokes_old_vet_sessions(client, db, registered_vet, vet_auth_header):
    token = create_password_reset_token(str(registered_vet.id), "vet", version=registered_vet.auth_version)
    assert client.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "brandnew123"}).status_code == 200
    assert client.get(f"{API}/auth/me", headers=vet_auth_header).status_code == 401


def test_forgot_password_token_for_vet_carries_version(client, db, registered_vet, sent):
    registered_vet.auth_version = 4
    db.commit()
    assert client.post(f"{API}/auth/forgot-password", json={"email": VET_DATA["email"], "user_type": "vet"}).status_code == 200
    assert len(sent) == 1
    from urllib.parse import parse_qs, urlparse
    import re
    url = re.search(r'href="([^"]*reset-password[^"]*)"', sent[0][2]).group(1)
    token = parse_qs(urlparse(url).query)["token"][0]
    from app.core.security import decode_password_reset_token
    assert decode_password_reset_token(token).version == 4


# --- change password / logout-all ---

def test_change_password_keeps_this_device_and_revokes_others(client, db, registered_vet, vet_auth_header):
    other = dict(vet_auth_header)
    resp = client.post(f"{API}/vet/settings/password", headers=vet_auth_header,
                       json={"current_password": VET_DATA["password"], "new_password": "brandnew123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert client.get(f"{API}/auth/me", headers=bearer(body["access_token"])).status_code == 200
    assert client.get(f"{API}/auth/me", headers=other).status_code == 401
    db.refresh(registered_vet)
    assert verify_password("brandnew123", registered_vet.password_hash)
    login = client.post(f"{API}/auth/vet/login", json={"email": VET_DATA["email"], "password": "brandnew123"})
    assert login.status_code == 200


def test_change_password_requires_correct_current_password(client, db, registered_vet, vet_auth_header):
    resp = client.post(f"{API}/vet/settings/password", headers=vet_auth_header,
                       json={"current_password": "wrong-password", "new_password": "brandnew123"})
    assert resp.status_code == 400
    db.refresh(registered_vet)
    assert registered_vet.auth_version == 0
    assert verify_password(VET_DATA["password"], registered_vet.password_hash)


def test_change_password_validates_new_password(client, vet_auth_header):
    short = client.post(f"{API}/vet/settings/password", headers=vet_auth_header,
                        json={"current_password": VET_DATA["password"], "new_password": "short12"})
    assert short.status_code == 422
    same = client.post(f"{API}/vet/settings/password", headers=vet_auth_header,
                       json={"current_password": VET_DATA["password"], "new_password": VET_DATA["password"]})
    assert same.status_code == 400


def test_vet_account_endpoints_require_a_vet(client, owner_auth_header):
    for path, body in (("password", {"current_password": "x", "new_password": "longenough1"}),
                       ("logout-all", {"current_password": "x"})):
        assert client.post(f"{API}/vet/settings/{path}", json=body).status_code == 401
        assert client.post(f"{API}/vet/settings/{path}", json=body, headers=owner_auth_header).status_code == 401


def test_logout_all_returns_fresh_token_and_revokes_old(client, db, registered_vet, vet_auth_header):
    wrong = client.post(f"{API}/vet/settings/logout-all", headers=vet_auth_header, json={"current_password": "nope"})
    assert wrong.status_code == 400
    assert client.get(f"{API}/auth/me", headers=vet_auth_header).status_code == 200
    resp = client.post(f"{API}/vet/settings/logout-all", headers=vet_auth_header,
                       json={"current_password": VET_DATA["password"]})
    assert resp.status_code == 200
    assert client.get(f"{API}/auth/me", headers=vet_auth_header).status_code == 401
    assert client.get(f"{API}/auth/me", headers=bearer(resp.json()["access_token"])).status_code == 200


# --- password length ---

def test_new_passwords_need_eight_characters_but_login_accepts_old_short_ones(client, db):
    short = "abc1234"
    assert client.post(f"{API}/auth/vet/register", json=vet_payload(password=short)).status_code == 422
    assert client.post(f"{API}/auth/pet-owner/register",
                       json={"email": "o@example.com", "password": short, "name": "Owner"}).status_code == 422
    assert client.post(f"{API}/auth/reset-password", json={"token": "x", "new_password": short}).status_code == 422
    assert client.post(f"{API}/invite/abc/register",
                       json={"name": "Owner", "email": "o@example.com", "password": short}).status_code == 422
    old = Vet(email="old@example.com", password_hash=get_password_hash("abc123"), name="Old", slug="old",
              specialty="x", license_number="L-OLD", phone="1", address="a", city="c",
              is_verified=True, email_verified=True)
    db.add(old)
    db.commit()
    assert client.post(f"{API}/auth/vet/login", json={"email": "old@example.com", "password": "abc123"}).status_code == 200


# --- registration: vets ---

def test_vet_register_new_sends_verification(client, db, sent):
    resp = client.post(f"{API}/auth/vet/register", json=vet_payload())
    assert resp.status_code == 201
    assert len(sent) == 1 and sent[0][0] == "new-vet@example.com"
    vet = db.scalar(select(Vet).where(Vet.email == "new-vet@example.com"))
    assert vet and not vet.email_verified


def test_vet_register_verified_email_is_generic_and_changes_nothing(client, db, registered_vet, sent):
    fresh = client.post(f"{API}/auth/vet/register", json=vet_payload())
    existing = client.post(f"{API}/auth/vet/register",
                           json=vet_payload(email=VET_DATA["email"], password="hijack-pass1", name="Hijacker",
                                            license_number="LIC-OTHER"))
    assert existing.status_code == fresh.status_code == 201
    assert existing.json()["message"] == fresh.json()["message"]
    db.refresh(registered_vet)
    assert registered_vet.name == VET_DATA["name"]
    assert verify_password(VET_DATA["password"], registered_vet.password_hash)
    assert registered_vet.auth_version == 0
    # Only the "you already have an account" notice goes to the existing address, no verification link.
    to_existing = [m for m in sent if m[0] == VET_DATA["email"]]
    assert len(to_existing) == 1 and "reset-password" not in to_existing[0][2] and "verify-email" not in to_existing[0][2]


def test_vet_register_replaces_unverified_squatter(client, db, sent):
    assert client.post(f"{API}/auth/vet/register",
                       json=vet_payload(password="squatter-pass1", name="Squatter")).status_code == 201
    squatter = db.scalar(select(Vet).where(Vet.email == "new-vet@example.com"))
    slug = squatter.slug
    assert client.post(f"{API}/auth/vet/register",
                       json=vet_payload(password="real-owner-pass1", name="Real Owner", license_number="LIC-REAL")).status_code == 201
    db.refresh(squatter)
    assert squatter.name == "Real Owner" and squatter.license_number == "LIC-REAL" and squatter.slug == slug
    assert verify_password("real-owner-pass1", squatter.password_hash)
    assert not verify_password("squatter-pass1", squatter.password_hash)
    assert db.scalars(select(Vet).where(Vet.email == "new-vet@example.com")).all() == [squatter]
    assert len(sent) == 2  # verification re-sent each time


def test_vet_register_duplicate_license_still_rejected(client, registered_vet):
    resp = client.post(f"{API}/auth/vet/register", json=vet_payload(license_number=VET_DATA["license_number"]))
    assert resp.status_code == 400


# --- registration: pet owners ---

def owner_payload(**over):
    data = {"email": "fresh-owner@example.com", "password": "password123", "name": "Fresh Owner"}
    data.update(over)
    return data


def test_owner_register_verified_email_is_generic_and_changes_nothing(client, db, registered_owner, sent):
    resp = client.post(f"{API}/auth/pet-owner/register",
                       json=owner_payload(email=OWNER_DATA["email"].upper(), password="hijack-pass1", name="Hijacker"))
    assert resp.status_code == 201
    db.refresh(registered_owner)
    assert registered_owner.name == OWNER_DATA["name"]
    assert verify_password(OWNER_DATA["password"], registered_owner.password_hash)
    assert registered_owner.auth_version == 0
    assert len(sent) == 1 and "verify-email" not in sent[0][2]


def test_owner_register_replaces_unverified_row(client, db, sent):
    assert client.post(f"{API}/auth/pet-owner/register",
                       json=owner_payload(password="squatter-pass1", name="Squatter")).status_code == 201
    row = db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com"))
    assert client.post(f"{API}/auth/pet-owner/register",
                       json=owner_payload(password="real-owner-pass1", name="Real Owner")).status_code == 201
    db.refresh(row)
    assert row.name == "Real Owner"
    assert verify_password("real-owner-pass1", row.password_hash)
    assert not row.email_verified
    assert len(db.scalars(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com")).all()) == 1
    assert len(sent) == 2


def test_owner_register_ignores_row_without_password(client, db, sent):
    row = PetOwner(email="clinic@example.com", name="Clinic Only", email_verified=False)
    db.add(row)
    db.commit()
    resp = client.post(f"{API}/auth/pet-owner/register", json=owner_payload(email="clinic@example.com"))
    assert resp.status_code == 201
    db.refresh(row)
    assert row.password_hash is None and row.name == "Clinic Only"
    assert sent == []


def test_invited_client_still_claims_after_squatter_is_replaced(client, db, registered_vet, sent):
    """Invite registration creates a pending unverified owner; a later self-registration for the same
    address replaces its password, and verifying still links the clinic card."""
    from datetime import datetime, timedelta
    from app.core.security import create_email_verification_token
    from app.db.base import VetClient
    card = VetClient(vet_id=registered_vet.id, name="Invited", email="invited@example.com", status="invited",
                     invite_token="tok-123", invite_expires_at=datetime.utcnow() + timedelta(days=1))
    db.add(card)
    db.commit()
    reg = client.post(f"{API}/invite/tok-123/register",
                      json={"name": "Squatter", "email": "invited@example.com", "password": "squatter-pass1"})
    assert reg.status_code in (200, 201)
    pending = db.scalar(select(PetOwner).where(PetOwner.email == "invited@example.com"))
    assert client.post(f"{API}/auth/pet-owner/register",
                       json=owner_payload(email="invited@example.com", password="real-owner-pass1")).status_code == 201
    db.refresh(pending)
    assert verify_password("real-owner-pass1", pending.password_hash)
    verify = client.post(f"{API}/auth/verify-email",
                         json={"token": create_email_verification_token(str(pending.id), "pet_owner")})
    assert verify.status_code == 200
    db.refresh(card)
    assert card.status == "linked" and card.pet_owner_id == pending.id
