"""Book a demo: the public form, the admin list, and vet accounts the team creates."""
from urllib.parse import parse_qs, urlparse
import re

import pytest
from sqlalchemy import select

from app.core.legal import TERMS_VERSION
from app.db.base import DemoRequest, Vet

API = "/api/v1"
FORM = {
    "name": "Ελένη Κ.", "clinic_name": "Κτηνιατρείο Δοκιμής", "email": "Clinic@Example.com",
    "phone": "2101234567", "city": "Πάτρα", "message": "Θέλουμε demo.\nΤρίτη απόγευμα;",
}
NEW_VET = {
    "name": "Δρ. Νέος", "email": "new.vet@example.com", "phone": "2101234500", "city": "Πάτρα",
    "address": "Οδός 1, Πάτρα", "specialty": "Μικρά ζώα", "license_number": "LIC-DEMO-1",
}


@pytest.fixture()
def sent(monkeypatch):
    box = []
    monkeypatch.setattr("app.core.email.send_email", lambda to, subject, html: box.append((to, subject, html)))
    return box


@pytest.fixture()
def team_inbox(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.DEMO_REQUEST_EMAIL", "team@example.com")
    return "team@example.com"


def _activation_token(mail_html: str) -> str:
    url = re.search(r'href="([^"]*/vet/activate\?token=[^"]+)"', mail_html).group(1)
    return parse_qs(urlparse(url.replace("&amp;", "&")).query)["token"][0]


# --- public form ---

def test_demo_request_is_stored_and_emailed_to_team_and_clinic(client, db, sent, team_inbox):
    response = client.post(f"{API}/public/demo-requests", json=FORM)
    assert response.status_code == 201, response.text
    stored = db.scalar(select(DemoRequest).where(DemoRequest.email == "clinic@example.com"))
    assert stored.status == "new" and stored.clinic_name == "Κτηνιατρείο Δοκιμής"
    team = [m for m in sent if m[0] == team_inbox]
    assert len(team) == 1 and "Πάτρα" in team[0][1] and "Τρίτη απόγευμα" in team[0][2] and "<br>" in team[0][2]
    assert [m[0] for m in sent if m[0] != team_inbox] == ["clinic@example.com"]


def test_demo_request_text_is_escaped_in_email(client, sent, team_inbox):
    client.post(f"{API}/public/demo-requests", json={**FORM, "clinic_name": "<b>Bold</b> Clinic"})
    team = next(m for m in sent if m[0] == team_inbox)
    assert "<b>Bold</b>" not in team[2] and "&lt;b&gt;Bold" in team[2]


def test_honeypot_answers_the_same_but_stores_and_sends_nothing(client, db, sent, team_inbox):
    response = client.post(f"{API}/public/demo-requests", json={**FORM, "email": "bot@example.com", "website": "spam"})
    assert response.status_code == 201
    assert db.scalar(select(DemoRequest).where(DemoRequest.email == "bot@example.com")) is None
    assert sent == []


def test_demo_request_without_team_address_is_still_stored(client, db, sent, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.DEMO_REQUEST_EMAIL", "")
    assert client.post(f"{API}/public/demo-requests", json=FORM).status_code == 201
    assert [m[0] for m in sent] == ["clinic@example.com"]


def test_demo_request_validates_fields(client):
    assert client.post(f"{API}/public/demo-requests", json={**FORM, "email": "not-an-email"}).status_code == 422
    assert client.post(f"{API}/public/demo-requests", json={**FORM, "phone": "1"}).status_code == 422


# --- admin list ---

def test_admin_lists_and_updates_demo_requests(client, db, admin_auth_header, sent):
    client.post(f"{API}/public/demo-requests", json=FORM)
    body = client.get(f"{API}/admin/demo-requests", params={"q": "Δοκιμής"}, headers=admin_auth_header).json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["status"] == "new" and item["message"].startswith("Θέλουμε demo")

    updated = client.patch(f"{API}/admin/demo-requests/{item['id']}", json={"status": "contacted"}, headers=admin_auth_header)
    assert updated.status_code == 200 and updated.json()["status"] == "contacted"
    # "converted" is set only by creating the account.
    assert client.patch(f"{API}/admin/demo-requests/{item['id']}", json={"status": "converted"},
                        headers=admin_auth_header).status_code == 400

    overview = client.get(f"{API}/admin/overview", headers=admin_auth_header).json()
    assert overview["demo_requests"]["total"] >= 1 and "demo_requests" in overview["weeks"][-1]


def test_demo_requests_need_an_admin(client, vet_auth_header):
    assert client.get(f"{API}/admin/demo-requests").status_code == 401
    assert client.get(f"{API}/admin/demo-requests", headers=vet_auth_header).status_code == 401


# --- vet accounts from the admin panel ---

def test_admin_creates_vet_from_demo_and_vet_activates(client, db, admin_auth_header, sent):
    client.post(f"{API}/public/demo-requests", json=FORM)
    demo = db.scalar(select(DemoRequest).where(DemoRequest.email == "clinic@example.com"))

    created = client.post(f"{API}/admin/vets", json={**NEW_VET, "demo_request_id": str(demo.id)}, headers=admin_auth_header)
    assert created.status_code == 201, created.text
    assert created.json()["status"] == "invited"
    db.refresh(demo)
    assert demo.status == "converted" and str(demo.vet_id) == created.json()["id"]

    # No password yet: cannot sign in.
    assert client.post(f"{API}/auth/vet/login", json={"email": NEW_VET["email"], "password": "anything-123"}).status_code == 401

    invite = next(m for m in sent if m[0] == NEW_VET["email"])
    token = _activation_token(invite[2])
    info = client.post(f"{API}/auth/vet/activation", json={"token": token})
    assert info.status_code == 200 and info.json() == {"name": NEW_VET["name"], "email": NEW_VET["email"]}

    refused = client.post(f"{API}/auth/vet/activate", json={"token": token, "password": "new-vet-pass1"})
    assert refused.status_code == 400  # terms not accepted
    activated = client.post(f"{API}/auth/vet/activate", json={"token": token, "password": "new-vet-pass1", "accept_terms": True})
    assert activated.status_code == 200, activated.text
    me = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {activated.json()['access_token']}"})
    assert me.status_code == 200 and me.json()["email"] == NEW_VET["email"]

    vet = db.scalar(select(Vet).where(Vet.email == NEW_VET["email"]))
    assert vet.email_verified and vet.terms_version == TERMS_VERSION
    assert client.post(f"{API}/auth/vet/login", json={"email": NEW_VET["email"], "password": "new-vet-pass1"}).status_code == 200
    # Single use.
    assert client.post(f"{API}/auth/vet/activate", json={"token": token, "password": "other-pass-12", "accept_terms": True}).status_code == 400

    listed = client.get(f"{API}/admin/vets", params={"q": NEW_VET["email"]}, headers=admin_auth_header).json()
    assert listed["items"][0]["status"] == "active"
    again = client.post(f"{API}/admin/vets", json={**NEW_VET, "demo_request_id": str(demo.id)}, headers=admin_auth_header)
    assert again.status_code == 409


def test_duplicate_email_or_licence_is_refused(client, admin_auth_header, registered_vet, sent):
    assert client.post(f"{API}/admin/vets", json={**NEW_VET, "email": registered_vet.email.upper()},
                       headers=admin_auth_header).status_code == 409
    assert client.post(f"{API}/admin/vets", json={**NEW_VET, "license_number": registered_vet.license_number},
                       headers=admin_auth_header).status_code == 409
    assert sent == []


def test_resend_invite_replaces_the_old_link(client, admin_auth_header, sent):
    vet_id = client.post(f"{API}/admin/vets", json=NEW_VET, headers=admin_auth_header).json()["id"]
    first = _activation_token(sent[-1][2])
    assert client.post(f"{API}/admin/vets/{vet_id}/resend-invite", headers=admin_auth_header).status_code == 200
    second = _activation_token(sent[-1][2])
    assert client.post(f"{API}/auth/vet/activation", json={"token": first}).status_code == 400
    assert client.post(f"{API}/auth/vet/activation", json={"token": second}).status_code == 200


def test_resend_invite_refused_once_active(client, admin_auth_header, registered_vet):
    assert client.post(f"{API}/admin/vets/{registered_vet.id}/resend-invite", headers=admin_auth_header).status_code == 400


def test_bad_activation_token_is_400(client):
    assert client.post(f"{API}/auth/vet/activation", json={"token": "not-a-real-token"}).status_code == 400
