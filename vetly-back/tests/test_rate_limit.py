"""Request limits on sign-in, account email and assistant endpoints."""

import pytest
from fastapi import HTTPException

from app.core.rate_limit import RateLimit, chat_limit, login_limit

AUTH = "/api/v1/auth"


def test_login_is_limited_per_address(client):
    body = {"email": "nobody@example.com", "password": "wrong-password"}
    for _ in range(login_limit.limit):
        assert client.post(f"{AUTH}/pet-owner/login", json=body).status_code == 401

    blocked = client.post(f"{AUTH}/pet-owner/login", json=body)
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) >= 1
    # The vet sign-in shares the same allowance.
    assert client.post(f"{AUTH}/vet/login", json=body).status_code == 429


def test_limit_follows_the_address_the_proxy_reports(client):
    body = {"email": "nobody@example.com", "password": "wrong-password"}
    first = {"X-Forwarded-For": "203.0.113.7"}
    for _ in range(login_limit.limit):
        client.post(f"{AUTH}/pet-owner/login", json=body, headers=first)
    assert client.post(f"{AUTH}/pet-owner/login", json=body, headers=first).status_code == 429

    other = {"X-Forwarded-For": "203.0.113.8"}
    assert client.post(f"{AUTH}/pet-owner/login", json=body, headers=other).status_code == 401
    # A forged leading entry does not buy a fresh allowance.
    forged = {"X-Forwarded-For": "198.51.100.1, 203.0.113.7"}
    assert client.post(f"{AUTH}/pet-owner/login", json=body, headers=forged).status_code == 429


def test_allowance_returns_after_the_window(monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr("app.core.rate_limit.time.monotonic", lambda: clock[0])
    limit = RateLimit("test", limit=2, window_seconds=60)
    limit.check("a")
    limit.check("a")
    with pytest.raises(HTTPException) as blocked:
        limit.check("a")
    assert blocked.value.status_code == 429
    limit.check("b")

    clock[0] += 61
    limit.check("a")


def test_assistant_messages_are_limited_per_user():
    for _ in range(chat_limit.limit):
        chat_limit.check("user-1")
    with pytest.raises(HTTPException):
        chat_limit.check("user-1")
    chat_limit.check("user-2")


def test_email_availability_probe_is_gone(client):
    response = client.get(f"{AUTH}/check-email", params={"email": "a@example.com", "user_type": "vet"})
    assert response.status_code in (404, 405)
