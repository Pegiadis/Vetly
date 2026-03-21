"""
Tests for authentication and registration endpoints.

Covers:
  - Owner & vet registration (success + duplicate checks)
  - Login (wrong password, nonexistent email)
  - Auth-required endpoints (missing token, wrong user type)
"""

import pytest


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class TestOwnerRegistration:
    """Tests for POST /api/v1/auth/pet-owner/register"""

    ENDPOINT = "/api/v1/auth/pet-owner/register"

    def test_register_owner_success(self, client):
        payload = {
            "email": "newowner@example.com",
            "password": "secure123",
            "name": "New Owner",
        }
        resp = client.post(self.ENDPOINT, json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == payload["email"]
        assert "message" in data

    def test_register_owner_duplicate_email(self, client, registered_owner):
        payload = {
            "email": registered_owner.email,
            "password": "secure123",
            "name": "Duplicate Owner",
        }
        resp = client.post(self.ENDPOINT, json=payload)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()


class TestVetRegistration:
    """Tests for POST /api/v1/auth/vet/register"""

    ENDPOINT = "/api/v1/auth/vet/register"

    def _vet_payload(self, **overrides):
        base = {
            "email": "newvet@example.com",
            "password": "secure123",
            "name": "Dr. New Vet",
            "specialty": "Surgery",
            "license_number": "NEW-LIC-001",
            "phone": "6900000099",
            "address": "Thessaloniki 10",
            "city": "Thessaloniki",
        }
        base.update(overrides)
        return base

    def test_register_vet_success(self, client):
        resp = client.post(self.ENDPOINT, json=self._vet_payload())
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newvet@example.com"
        assert "message" in data

    def test_register_vet_duplicate_email(self, client, registered_vet):
        payload = self._vet_payload(email=registered_vet.email)
        resp = client.post(self.ENDPOINT, json=payload)
        assert resp.status_code == 400
        assert "email already registered" in resp.json()["detail"].lower()

    def test_register_vet_duplicate_license(self, client, registered_vet):
        payload = self._vet_payload(
            email="other@example.com",
            license_number=registered_vet.license_number,
        )
        resp = client.post(self.ENDPOINT, json=payload)
        assert resp.status_code == 400
        assert "license" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:
    """Tests for login endpoints with wrong credentials."""

    def test_login_wrong_password(self, client, registered_owner):
        resp = client.post("/api/v1/auth/pet-owner/login", json={
            "email": registered_owner.email,
            "password": "wrongpassword",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/v1/auth/pet-owner/login", json={
            "email": "nobody@example.com",
            "password": "whatever123",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Auth-required endpoints
# ---------------------------------------------------------------------------

class TestAuthRequired:
    """Tests that protected endpoints reject unauthenticated or wrong-role requests."""

    OWNER_ENDPOINT = "/api/v1/auth/pet-owner/me"
    VET_ENDPOINT = "/api/v1/auth/me"

    def test_owner_endpoint_requires_auth(self, client):
        resp = client.get(self.OWNER_ENDPOINT)
        assert resp.status_code == 401

    def test_vet_endpoint_requires_auth(self, client):
        resp = client.get(self.VET_ENDPOINT)
        assert resp.status_code == 401

    def test_owner_token_rejected_on_vet_endpoint(self, client, owner_auth_header):
        resp = client.get(self.VET_ENDPOINT, headers=owner_auth_header)
        assert resp.status_code == 401

    def test_vet_token_rejected_on_owner_endpoint(self, client, vet_auth_header):
        resp = client.get(self.OWNER_ENDPOINT, headers=vet_auth_header)
        assert resp.status_code == 401
