from urllib.parse import urlparse, parse_qs
from sqlalchemy import select
from app.db.base import PetOwner
from app.core.security import create_email_verification_token, create_password_reset_token
from app.core.email import auth_email_url

AUTH = '/api/v1/auth'

def test_mobile_registration_and_verification(client, db, monkeypatch):
    emails = []
    monkeypatch.setattr('app.services.auth.send_verification_email', lambda *args: emails.append(args))
    data = {'name': 'Mobile Test', 'email': 'mobile-registration@example.com', 'password': 'MobileTest123', 'client': 'mobile'}
    assert client.post(AUTH + '/pet-owner/register', json=data).status_code == 201
    assert emails[0][3] == 'mobile'
    login = {key: data[key] for key in ['email', 'password']}
    assert client.post(AUTH + '/pet-owner/login', json=login).status_code == 403
    assert client.post(AUTH + '/resend-verification', json={'email': data['email'], 'user_type': 'pet_owner', 'client': 'mobile'}).status_code == 200
    token = emails[-1][1]
    assert client.post(AUTH + '/verify-email', json={'token': token, 'user_type': 'pet_owner'}).status_code == 200
    assert client.post(AUTH + '/pet-owner/login', json=login).status_code == 200
    # A consumed email verification link must not mint fresh sessions indefinitely.
    assert client.post(AUTH + '/verify-email', json={'token': token}).status_code == 400
    assert db.scalar(select(PetOwner).where(PetOwner.email == data['email'])).email_verified

def test_mobile_reset_single_use_and_revokes_sessions(client, registered_owner, owner_auth_header, monkeypatch):
    emails = []
    monkeypatch.setattr('app.services.auth.send_password_reset_email', lambda *args: emails.append(args))
    payload = {'email': registered_owner.email, 'user_type': 'pet_owner', 'client': 'mobile'}
    known = client.post(AUTH + '/forgot-password', json=payload)
    unknown = client.post(AUTH + '/forgot-password', json={**payload, 'email': 'unknown-mobile@example.com'})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert len(emails) == 1 and emails[0][3] == 'mobile'
    body = {'token': emails[0][1], 'new_password': 'ChangedMobile123', 'user_type': 'pet_owner'}
    assert client.post(AUTH + '/reset-password', json=body).status_code == 200
    assert client.get('/api/v1/owner/settings', headers=owner_auth_header).status_code == 401
    assert client.post(AUTH + '/reset-password', json=body).status_code == 400
    assert client.post(AUTH + '/pet-owner/login', json={'email': registered_owner.email, 'password': 'test123456'}).status_code == 401
    assert client.post(AUTH + '/pet-owner/login', json={'email': registered_owner.email, 'password': body['new_password']}).status_code == 200
    # A fresh reset after auth_version changes remains usable.
    client.post(AUTH + '/forgot-password', json=payload)
    assert client.post(AUTH + '/reset-password', json={**body, 'token': emails[-1][1]}).status_code == 200

def test_mobile_rejects_vet_and_invalid_tokens(client, registered_vet):
    verify = create_email_verification_token(str(registered_vet.id), 'vet')
    reset = create_password_reset_token(str(registered_vet.id), 'vet')
    for endpoint, token, extra in [('verify-email', verify, {}), ('reset-password', reset, {'new_password': 'ChangedMobile123'})]:
        assert client.post(AUTH + '/' + endpoint, json={'token': token, 'user_type': 'pet_owner', **extra}).status_code == 400
        assert client.post(AUTH + '/' + endpoint, json={'token': 'invalid', 'user_type': 'pet_owner', **extra}).status_code == 400

def test_auth_email_destinations_are_fixed():
    link = urlparse(auth_email_url('reset-password', 'a+b/c', 'pet_owner', 'mobile'))
    assert link.path == '/mobile-auth'
    assert parse_qs(link.query) == {'action': ['reset-password'], 'token': ['a+b/c']}
    assert urlparse(auth_email_url('verify-email', 'abc', 'pet_owner', 'web')).path == '/verify-email'
    assert urlparse(auth_email_url('reset-password', 'abc', 'vet', 'mobile')).path == '/reset-password'

def test_overlong_unicode_password_returns_validation_error(client):
    assert client.post(AUTH + '/pet-owner/register', json={'name': 'Test Owner', 'email': 'long-mobile@example.com', 'password': 'α' * 40}).status_code == 422
    assert client.post(AUTH + '/reset-password', json={'token': 'test', 'new_password': 'α' * 40}).status_code == 422

def test_reset_link_revoked_by_logout_all(client, registered_owner, owner_auth_header):
    token = create_password_reset_token(str(registered_owner.id), 'pet_owner', version=registered_owner.auth_version)
    assert client.post('/api/v1/owner/settings/logout-all', headers=owner_auth_header, json={'current_password': 'test123456'}).status_code == 204
    assert client.post(AUTH + '/reset-password', json={'token': token, 'new_password': 'MobileTest123'}).status_code == 400

def test_expired_reset_link(client, registered_owner):
    import jwt
    from datetime import datetime, timedelta, timezone
    from app.core.config import settings
    token = jwt.encode({'sub': str(registered_owner.id), 'type': 'pet_owner', 'purpose': 'password_reset', 'exp': datetime.now(timezone.utc) - timedelta(seconds=1)}, settings.SECRET_KEY, algorithm='HS256')
    assert client.post(AUTH + '/reset-password', json={'token': token, 'new_password': 'MobileTest123'}).status_code == 400
