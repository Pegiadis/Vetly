"""Consent recording and invite registration without account probing."""
from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from app.core.legal import TERMS_VERSION
from app.core.security import create_email_verification_token, get_password_hash, verify_password
from app.db.base import PetOwner, VetClient
from tests.conftest import OWNER_DATA, VET_DATA

API = "/api/v1"


@pytest.fixture()
def sent(monkeypatch):
    box = []
    monkeypatch.setattr("app.core.email.send_email", lambda to, subject, html: box.append((to, subject, html)))
    return box


def vet_payload(**over):
    data = dict(VET_DATA, email="fresh-vet@example.com", license_number="LIC-FRESH-1", accept_terms=True)
    data.update(over)
    return data


def owner_payload(**over):
    data = {"email": "fresh-owner@example.com", "password": "password123", "name": "Fresh Owner", "accept_terms": True}
    data.update(over)
    return data


def make_invite(db, vet, token="invite-tok", email="invitee@example.com"):
    card = VetClient(vet_id=vet.id, name="Invitee", email=email, status="invited",
                     invite_token=token, invite_expires_at=datetime.utcnow() + timedelta(days=1))
    db.add(card)
    db.commit()
    return card


def invite_payload(**over):
    data = {"name": "Invitee", "email": "invitee@example.com", "password": "invite-pass1", "accept_terms": True}
    data.update(over)
    return data


# --- consent ---

def test_owner_register_requires_terms_on_web(client, db):
    assert client.post(f"{API}/auth/pet-owner/register", json=owner_payload(accept_terms=False)).status_code == 400
    assert client.post(f"{API}/auth/pet-owner/register", json=owner_payload()).status_code == 201
    owner = db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com"))
    assert owner.terms_version == TERMS_VERSION and owner.terms_accepted_at is not None


def test_mobile_owner_register_requires_terms_too(client, db):
    resp = client.post(f"{API}/auth/pet-owner/register", json=owner_payload(client="mobile", accept_terms=False))
    assert resp.status_code == 400
    assert db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com")) is None


def test_mobile_owner_register_records_consent_when_sent(client, db):
    assert client.post(f"{API}/auth/pet-owner/register", json=owner_payload(client="mobile")).status_code == 201
    owner = db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com"))
    assert owner.terms_version == TERMS_VERSION


def test_invite_register_requires_terms_and_records_them(client, db, registered_vet):
    make_invite(db, registered_vet)
    assert client.post(f"{API}/invite/invite-tok/register", json=invite_payload(accept_terms=False)).status_code == 400
    assert client.post(f"{API}/invite/invite-tok/register", json=invite_payload()).status_code == 200
    owner = db.scalar(select(PetOwner).where(PetOwner.email == "invitee@example.com"))
    assert owner.terms_version == TERMS_VERSION and owner.terms_accepted_at is not None


# --- invite registration does not reveal accounts ---

def test_invite_register_for_verified_account_looks_like_a_new_registration(client, db, registered_vet, sent):
    make_invite(db, registered_vet)
    fresh = client.post(f"{API}/invite/invite-tok/register", json=invite_payload())
    db.query(PetOwner).filter(PetOwner.email == "invitee@example.com").delete()
    db.commit()
    verified = PetOwner(email="invitee@example.com", name="Existing", password_hash=get_password_hash("old-pass-123"),
                        email_verified=True)
    db.add(verified)
    db.commit()
    sent.clear()

    resp = client.post(f"{API}/invite/invite-tok/register", json=invite_payload(password="hijack-pass1", name="Hijacker"))
    assert resp.status_code == fresh.status_code == 200
    assert resp.json() == fresh.json()
    db.refresh(verified)
    assert verified.name == "Existing" and verify_password("old-pass-123", verified.password_hash)
    assert len(sent) == 1 and sent[0][0] == "invitee@example.com" and "verify-email" not in sent[0][2]


def test_invite_register_cannot_probe_other_emails(client, db, registered_vet, registered_owner):
    make_invite(db, registered_vet)
    resp = client.post(f"{API}/invite/invite-tok/register", json=invite_payload(email=OWNER_DATA["email"]))
    unknown = client.post(f"{API}/invite/invite-tok/register", json=invite_payload(email="nobody@example.com"))
    assert resp.status_code == unknown.status_code == 400 and resp.json() == unknown.json()


def test_invite_register_replaces_unverified_account_and_still_claims(client, db, registered_vet, sent):
    card = make_invite(db, registered_vet)
    squatter = PetOwner(email="invitee@example.com", name="Squatter", password_hash=get_password_hash("squat-pass-1"),
                        email_verified=False)
    db.add(squatter)
    db.commit()

    assert client.post(f"{API}/invite/invite-tok/register", json=invite_payload()).status_code == 200
    db.refresh(squatter)
    db.refresh(card)
    assert squatter.name == "Invitee" and verify_password("invite-pass1", squatter.password_hash)
    assert card.pending_owner_id == squatter.id

    verified = client.post(f"{API}/auth/verify-email", json={"token": create_email_verification_token(str(squatter.id), "pet_owner")})
    assert verified.status_code == 200
    db.refresh(card)
    assert card.status == "linked" and card.pet_owner_id == squatter.id


# --- licence squatting ---


