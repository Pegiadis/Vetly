"""Consent recording, invite registration without account probing, licence squatting,
approval email and the admin flag on /auth/me."""
from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from app.core.legal import TERMS_VERSION
from app.core.security import create_access_token, create_email_verification_token, get_password_hash, verify_password
from app.db.base import PetOwner, Vet, VetClient
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

def test_vet_register_requires_terms_and_records_them(client, db):
    refused = client.post(f"{API}/auth/vet/register", json=vet_payload(accept_terms=False))
    assert refused.status_code == 400 and "Όρους" in refused.json()["detail"]
    assert db.scalar(select(Vet).where(Vet.email == "fresh-vet@example.com")) is None

    assert client.post(f"{API}/auth/vet/register", json=vet_payload()).status_code == 201
    vet = db.scalar(select(Vet).where(Vet.email == "fresh-vet@example.com"))
    assert vet.terms_version == TERMS_VERSION and vet.terms_accepted_at is not None


def test_missing_flag_is_refused_like_false(client):
    data = vet_payload()
    del data["accept_terms"]
    assert client.post(f"{API}/auth/vet/register", json=data).status_code == 400


def test_consent_check_does_not_depend_on_existing_account(client, registered_vet, registered_owner):
    existing = client.post(f"{API}/auth/vet/register", json=vet_payload(email=VET_DATA["email"], accept_terms=False))
    fresh = client.post(f"{API}/auth/vet/register", json=vet_payload(accept_terms=False))
    assert existing.status_code == fresh.status_code == 400 and existing.json() == fresh.json()


def test_owner_register_requires_terms_on_web(client, db):
    assert client.post(f"{API}/auth/pet-owner/register", json=owner_payload(accept_terms=False)).status_code == 400
    assert client.post(f"{API}/auth/pet-owner/register", json=owner_payload()).status_code == 201
    owner = db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com"))
    assert owner.terms_version == TERMS_VERSION and owner.terms_accepted_at is not None


def test_mobile_owner_register_is_lenient_and_stores_no_false_consent(client, db):
    resp = client.post(f"{API}/auth/pet-owner/register", json=owner_payload(client="mobile", accept_terms=False))
    assert resp.status_code == 201
    owner = db.scalar(select(PetOwner).where(PetOwner.email == "fresh-owner@example.com"))
    assert owner.terms_accepted_at is None and owner.terms_version is None


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

def _vet_row(db, email, licence, *, email_verified, is_verified):
    vet = Vet(email=email, password_hash=get_password_hash("whatever-123"), name="Holder", slug=f"holder-{licence.lower()}",
              specialty="x", license_number=licence, phone="12345", address="Somewhere 1", city="Athens",
              email_verified=email_verified, is_verified=is_verified)
    db.add(vet)
    db.commit()
    return vet


def test_unverified_unapproved_holder_does_not_block_licence(client, db):
    squatter = _vet_row(db, "squatter@example.com", "LIC-SQUAT", email_verified=False, is_verified=False)
    resp = client.post(f"{API}/auth/vet/register", json=vet_payload(license_number="LIC-SQUAT"))
    assert resp.status_code == 201
    assert db.scalar(select(Vet).where(Vet.email == "squatter@example.com")) is None
    new = db.scalar(select(Vet).where(Vet.email == "fresh-vet@example.com"))
    assert new.license_number == "LIC-SQUAT" and new.id != squatter.id


@pytest.mark.parametrize("email_verified,is_verified", [(True, False), (False, True), (True, True)])
def test_verified_or_approved_holder_still_blocks_licence(client, db, email_verified, is_verified):
    _vet_row(db, "holder@example.com", "LIC-HELD", email_verified=email_verified, is_verified=is_verified)
    resp = client.post(f"{API}/auth/vet/register", json=vet_payload(license_number="LIC-HELD"))
    assert resp.status_code == 400
    assert db.scalar(select(Vet).where(Vet.email == "holder@example.com")) is not None
    assert db.scalar(select(Vet).where(Vet.email == "fresh-vet@example.com")) is None


# --- approval email ---

@pytest.fixture()
def admin_env(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", VET_DATA["email"])


def test_approval_sends_greek_email_with_login_link(client, db, registered_vet, vet_auth_header, admin_env, sent):
    pending = _vet_row(db, "pending@example.com", "LIC-PEND", email_verified=True, is_verified=False)
    resp = client.post(f"{API}/admin/vets/{pending.id}/approve", headers=vet_auth_header)
    assert resp.status_code == 200
    mails = [m for m in sent if m[0] == "pending@example.com"]
    assert len(mails) == 1
    assert "εγκρίθηκε" in mails[0][1] and "/vet/login" in mails[0][2]


def test_approval_survives_email_failure(client, db, registered_vet, vet_auth_header, admin_env, monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("smtp down")
    monkeypatch.setattr("app.core.email.send_email", boom)
    pending = _vet_row(db, "pending2@example.com", "LIC-PEND2", email_verified=True, is_verified=False)
    resp = client.post(f"{API}/admin/vets/{pending.id}/approve", headers=vet_auth_header)
    assert resp.status_code == 200
    db.refresh(pending)
    assert pending.is_verified is True


def test_repeat_approval_does_not_resend(client, db, registered_vet, vet_auth_header, admin_env, sent):
    pending = _vet_row(db, "pending3@example.com", "LIC-PEND3", email_verified=True, is_verified=False)
    client.post(f"{API}/admin/vets/{pending.id}/approve", headers=vet_auth_header)
    client.post(f"{API}/admin/vets/{pending.id}/approve", headers=vet_auth_header)
    assert len([m for m in sent if m[0] == "pending3@example.com"]) == 1


# --- is_admin on /auth/me ---

def test_me_exposes_is_admin_only_for_listed_emails(client, vet_auth_header, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", "")
    assert client.get(f"{API}/auth/me", headers=vet_auth_header).json()["is_admin"] is False
    monkeypatch.setattr("app.core.config.settings.ADMIN_EMAILS", VET_DATA["email"].upper())
    assert client.get(f"{API}/auth/me", headers=vet_auth_header).json()["is_admin"] is True


def test_is_admin_is_not_in_other_vet_responses():
    from app.schemas.vet import VetResponse
    assert "is_admin" not in VetResponse.model_fields
