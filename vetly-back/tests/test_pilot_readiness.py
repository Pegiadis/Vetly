"""Regression tests for the closed-pilot authorization and booking boundaries."""
from datetime import timedelta

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.db.base import Vet
from tests.test_appointments import (
    _make_pet, _make_vet, _next_weekday_at, _vet_headers, WEEKDAY_HOURS,
)


@pytest.fixture
def pilot_data(db, registered_owner, registered_vet):
    registered_vet.hours = WEEKDAY_HOURS
    db.commit()
    return registered_vet, _make_pet(db, registered_owner.id)


def book(client, headers, vet, pet, hour=10, minute=0, duration=30):
    return client.post('/api/v1/owner/appointments', headers=headers, json={
        'vet_id': str(vet.id), 'pet_id': str(pet.id),
        'scheduled_at': _next_weekday_at(hour, minute).isoformat(),
        'type': 'Checkup', 'duration_minutes': duration,
    })


def test_unrelated_vet_cannot_create_relationship(client, db, pilot_data, vet_auth_header):
    vet, pet = pilot_data
    response = client.post('/api/v1/vet/appointments', headers=vet_auth_header, json={
        'pet_id': str(pet.id), 'scheduled_at': _next_weekday_at(10, 0).isoformat(), 'type': 'Checkup'})
    assert response.status_code == 404
    for suffix in ('', '/history'):
        assert client.get(f'/api/v1/vet/patients/{pet.id}{suffix}', headers=vet_auth_header).status_code == 404


def test_unrelated_vet_cannot_create_reminder(client, pilot_data, vet_auth_header):
    _, pet = pilot_data
    response = client.post('/api/v1/vet/reminders', headers=vet_auth_header, json={
        'pet_id': str(pet.id), 'type': 'vaccination',
        'due_date': _next_weekday_at(10, 0).date().isoformat(),
        'reminder_days_before': 1,
    })
    assert response.status_code == 404, response.text


@pytest.mark.parametrize('actor', ['owner', 'vet'])
def test_reschedule_excludes_self_but_not_other_bookings(client, db, pilot_data, owner_auth_header, vet_auth_header, registered_owner, actor):
    vet, pet = pilot_data
    response = book(client, owner_auth_header, vet, pet)
    assert response.status_code == 201, response.text
    apt_id = response.json()['id']
    headers = owner_auth_header if actor == 'owner' else vet_auth_header
    method = client.patch if actor == 'owner' else client.post
    url = f'/api/v1/{actor}/appointments/{apt_id}/reschedule'
    moved = method(url, headers=headers, json={'scheduled_at': _next_weekday_at(10, 15).isoformat()})
    assert moved.status_code == 200, moved.text
    other = _make_pet(db, registered_owner.id)
    assert book(client, owner_auth_header, vet, other, hour=11).status_code == 201
    conflict = method(url, headers=headers, json={'scheduled_at': _next_weekday_at(10, 45).isoformat()})
    assert conflict.status_code == 409


@pytest.mark.parametrize('hour,minute,duration,expected', [(17,45,60,400),(17,30,30,201),(18,0,30,400)])
def test_whole_appointment_must_fit_hours(client, pilot_data, owner_auth_header, hour, minute, duration, expected):
    vet, pet = pilot_data
    response = book(client, owner_auth_header, vet, pet, hour, minute, duration)
    assert response.status_code == expected, response.text


def test_split_shift_and_missing_hours(client, db, pilot_data, owner_auth_header):
    vet, pet = pilot_data
    vet.hours = {'monday': {'morning': {'open': '09:00', 'close': '13:00'}, 'afternoon': {'open': '17:00', 'close': '20:00'}}}
    db.commit()
    assert book(client, owner_auth_header, vet, pet, 12, 45, 30).status_code == 400
    vet.hours = None
    db.commit()
    assert book(client, owner_auth_header, vet, pet).status_code == 400


def test_vet_can_book_existing_patient_and_cannot_access_another_vets_booking(client, db, pilot_data, owner_auth_header, vet_auth_header):
    vet, pet = pilot_data
    response = book(client, owner_auth_header, vet, pet)
    assert response.status_code == 201
    created = client.post('/api/v1/vet/appointments', headers=vet_auth_header, json={
        'pet_id': str(pet.id), 'scheduled_at': _next_weekday_at(12, 0).isoformat(), 'type': 'Checkup'})
    assert created.status_code == 201, created.text
    stranger = _make_vet(db, hours=WEEKDAY_HOURS)
    headers = _vet_headers(stranger)
    assert client.get(f"/api/v1/vet/appointments/{response.json()['id']}", headers=headers).status_code == 404
    assert client.get(f'/api/v1/vet/patients/{pet.id}/history', headers=headers).status_code == 404


def test_registration_does_not_verify_professional(client, db):
    response = client.post('/api/v1/auth/vet/register', json={
        'email':'pending-pilot@example.com', 'password':'TestPass123', 'name':'Pending',
        'specialty':'General', 'license_number':'PILOT-123', 'phone':'2101234567',
        'address':'Test Street', 'city':'Athens',
    })
    assert response.status_code == 201, response.text
    vet = db.scalar(select(Vet).where(Vet.email == 'pending-pilot@example.com'))
    assert vet.is_verified is False
    from app.core.security import create_email_verification_token
    verified = client.post('/api/v1/auth/verify-email', json={
        'token': create_email_verification_token(str(vet.id), 'vet')})
    assert verified.status_code == 200
    assert verified.json()['pending_professional_verification'] is True
    assert client.get('/api/v1/vet/patients', headers={
        'Authorization': f"Bearer {verified.json()['access_token']}"}).status_code == 403


def test_unverified_vet_cannot_operate_or_receive_bookings(client, db, pilot_data, owner_auth_header, vet_auth_header):
    vet, pet = pilot_data
    vet.is_verified = False
    db.commit()
    assert client.get('/api/v1/vet/patients', headers=vet_auth_header).status_code == 403
    assert book(client, owner_auth_header, vet, pet).status_code == 404
    assert client.get(f'/api/v1/vets/{vet.id}', headers=owner_auth_header).status_code == 404
    for url in ('/api/v1/vets', '/api/v1/vets/search?q=Test', '/api/v1/vets/search?city=Athens', '/api/v1/public/vets'):
        assert str(vet.id) not in [item['id'] for item in client.get(url, headers=owner_auth_header).json()['items']]


def test_closed_pilot_blocks_signup_and_existing_token(client, monkeypatch, owner_auth_header, registered_owner):
    monkeypatch.setattr(settings, 'PILOT_MODE', True)
    monkeypatch.setattr(settings, 'PILOT_ALLOWED_EMAILS', [])
    assert client.post('/api/v1/auth/pet-owner/register', json={
        'email':'uninvited@example.com', 'password':'TestPass123', 'name':'Uninvited'
    }).status_code == 403
    assert client.get('/api/v1/owner/pets', headers=owner_auth_header).status_code == 403
    monkeypatch.setattr(settings, 'PILOT_ALLOWED_EMAILS', [registered_owner.email.upper()])
    assert client.get('/api/v1/owner/pets', headers=owner_auth_header).status_code == 200


def test_explicit_timezone_converted_to_athens_wall_time():
    from datetime import datetime
    from app.services.scheduling import appointment_time
    assert appointment_time(datetime.fromisoformat('2030-01-07T08:00:00+00:00')) == datetime(2030,1,7,10)


def test_slots_respect_service_duration(client, pilot_data, owner_auth_header):
    vet, _ = pilot_data
    day = _next_weekday_at(10, 0).date().isoformat()
    slots = client.get(f'/api/v1/vets/{vet.id}/available-slots?date={day}&duration_minutes=60', headers=owner_auth_header).json()['slots']
    assert '17:00' in slots
    assert '17:30' not in slots


def test_booking_rejects_service_from_another_vet(client, db, pilot_data, owner_auth_header):
    from app.db.base import ServiceType
    vet, pet = pilot_data
    other = _make_vet(db)
    service = ServiceType(vet_id=other.id, name='Other service', price=30, duration_minutes=30)
    db.add(service)
    db.commit()
    response = client.post('/api/v1/owner/appointments', headers=owner_auth_header, json={
        'vet_id': str(vet.id), 'pet_id': str(pet.id), 'service_type_id': str(service.id),
        'scheduled_at': _next_weekday_at(10, 0).isoformat(), 'type': 'Checkup', 'duration_minutes': 30})
    assert response.status_code == 404


def test_ready_checks_database(client):
    assert client.get('/ready').status_code == 200


def test_reschedule_slot_list_excludes_only_own_appointment(client, db, pilot_data, owner_auth_header, vet_auth_header):
    vet, pet = pilot_data
    response = book(client, owner_auth_header, vet, pet, duration=60)
    assert response.status_code == 201
    day = _next_weekday_at(10, 0).date().isoformat()
    url = f'/api/v1/vets/{vet.id}/available-slots?date={day}&duration_minutes=60'
    assert '10:30' not in client.get(url, headers=owner_auth_header).json()['slots']
    url += f"&exclude_appointment_id={response.json()['id']}"
    assert client.get(url).status_code == 401
    for headers in (owner_auth_header, vet_auth_header):
        available = client.get(url, headers=headers)
        assert available.status_code == 200, available.text
        assert '10:30' in available.json()['slots']
    stranger = _make_vet(db)
    assert client.get(url, headers=_vet_headers(stranger)).status_code == 404


@pytest.mark.parametrize('purpose', ['verify', 'reset'])
def test_email_tokens_cannot_be_used_as_login(client, registered_owner, purpose):
    from app.core.security import create_email_verification_token, create_password_reset_token
    create = create_email_verification_token if purpose == 'verify' else create_password_reset_token
    token = create(str(registered_owner.id), 'pet_owner')
    assert client.get('/api/v1/owner/pets', headers={'Authorization': f'Bearer {token}'}).status_code == 401


def test_invite_requires_email_verification(client, db, registered_vet, monkeypatch):
    from app.models.vet_client import VetClient
    from app.db.base import PetOwner
    from app.core.security import create_email_verification_token
    from datetime import datetime
    invite = VetClient(vet_id=registered_vet.id, name='Pilot Invite', email='invite-pilot@example.com',
                       status='invited', invite_token='pilot-regression-invite',
                       invite_expires_at=datetime.utcnow() + timedelta(days=1))
    db.add(invite)
    db.commit()
    payload = {'email': invite.email, 'name': 'Pilot Invite', 'password': 'TestPass123'}
    response = client.post('/api/v1/invite/pilot-regression-invite/register', json=payload)
    assert response.status_code == 200, response.text
    assert 'access_token' not in response.json()
    owner = db.scalar(select(PetOwner).where(PetOwner.email == payload['email']))
    assert owner.email_verified is False
    verified = client.post('/api/v1/auth/verify-email', json={
        'token': create_email_verification_token(str(owner.id), 'pet_owner')})
    assert verified.status_code == 200, verified.text
    headers = {'Authorization': f"Bearer {verified.json()['access_token']}"}
    assert client.get('/api/v1/owner/pets', headers=headers).status_code == 200


def test_reminder_processing_is_scoped_and_repeatable(db, pilot_data, registered_owner):
    from app.repositories.reminder import ReminderRepository
    from app.services.reminder import ReminderService
    from app.db.base import Notification
    from datetime import date
    vet, pet = pilot_data
    other = _make_vet(db)
    repo = ReminderRepository(db)
    for vet_id in (vet.id, other.id):
        repo.create(pet_id=pet.id, vet_id=vet_id, pet_owner_id=registered_owner.id,
                    type='vaccination', title='Pilot reminder', message=None,
                    due_date=date.today(), reminder_date=date.today())
    db.commit()
    service = ReminderService(db)
    assert service.process_due_reminders(vet_id=vet.id) == 1
    assert service.process_due_reminders(vet_id=vet.id) == 0
    assert len(repo.get_due_reminders(date.today(), vet_id=other.id)) == 1
    notes = db.scalars(select(Notification).where(Notification.pet_owner_id == registered_owner.id,
                                                Notification.type == 'reminder')).all()
    assert len(notes) == 1


def test_concurrent_bookings_only_one_wins():
    """Independent PostgreSQL transactions; only uniquely created rows are removed."""
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from sqlalchemy import delete
    from app.db.session import SessionLocal
    from app.db.base import Appointment, PetOwner
    from app.repositories.owner import OwnerRepository
    from tests.test_appointments import _make_owner
    vet_id = owner_id = None
    try:
        with SessionLocal() as setup:
            vet_id = _make_vet(setup, hours=WEEKDAY_HOURS).id
            owner_id = _make_owner(setup).id
            pet_id = _make_pet(setup, owner_id).id
        barrier = Barrier(2)
        def reserve():
            with SessionLocal() as session:
                repo = OwnerRepository(session)
                barrier.wait(timeout=10)
                when = _next_weekday_at(10, 0)
                if repo.has_conflicting_appointment(vet_id, when, 30):
                    return 'conflict'
                repo.create_appointment(pet_owner_id=owner_id, vet_id=vet_id, pet_id=pet_id,
                                        scheduled_at=when, appointment_type='Checkup', duration_minutes=30)
                return 'booked'
        with ThreadPoolExecutor(max_workers=2) as workers:
            results = list(workers.map(lambda _: reserve(), range(2)))
        assert sorted(results) == ['booked', 'conflict']
        with SessionLocal() as check:
            assert len(check.scalars(select(Appointment).where(Appointment.vet_id == vet_id)).all()) == 1
    finally:
        with SessionLocal() as cleanup:
            if vet_id:
                cleanup.execute(delete(Vet).where(Vet.id == vet_id))
            if owner_id:
                cleanup.execute(delete(PetOwner).where(PetOwner.id == owner_id))
            cleanup.commit()


def test_vet_lists_require_sign_in(client, registered_vet, owner_auth_header, vet_auth_header):
    """There is no public directory: lists and lookups need an account."""
    vet = registered_vet
    protected = ('/api/v1/vets', '/api/v1/vets/search?q=Test', '/api/v1/vets/on-call',
                 f'/api/v1/vets/{vet.id}', f'/api/v1/vets/{vet.id}/available-slots?date=2030-01-07',
                 '/api/v1/public/vets')
    for url in protected:
        assert client.get(url).status_code == 401, url
        assert client.get(url, headers={'Authorization': 'Bearer not-a-token'}).status_code == 401, url
    for headers in (owner_auth_header, vet_auth_header):
        assert client.get('/api/v1/vets', headers=headers).status_code == 200
        assert client.get('/api/v1/public/vets', headers=headers).status_code == 200
