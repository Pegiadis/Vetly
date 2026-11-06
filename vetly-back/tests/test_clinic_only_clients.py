"""Clinic-only patients retain clinical IDs when a verified guardian joins."""
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select
from app.models.pet import Pet
from app.models.pet_owner import PetOwner
from app.models.vet_client import VetClient, VetClientPet
from app.models.appointment import Appointment
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.core.security import create_access_token, create_email_verification_token
from tests.test_appointments import _next_weekday_at, _make_vet, _vet_headers, WEEKDAY_HOURS


def make_card(client, headers, email=None):
    response = client.post('/api/v1/vet/clients', headers=headers, json={
        'name': 'Clinic Guardian', 'phone': '6900000012', 'email': email, 'notes': 'PRIVATE CLIENT NOTE'})
    assert response.status_code == 201, response.text
    card = response.json()
    response = client.post(f"/api/v1/vet/clients/{card['id']}/pets", headers=headers,
                           json={'name': 'Luna', 'type': 'Cat', 'notes': 'PRIVATE PET NOTE'})
    assert response.status_code == 201, response.text
    return card, response.json()


def create_visit(client, db, vet, headers, pet):
    vet.hours = WEEKDAY_HOURS
    db.commit()
    response = client.post('/api/v1/vet/appointments', headers=headers, json={
        'pet_id': pet['pet_id'], 'scheduled_at': _next_weekday_at(10, 0).isoformat(),
        'type': 'Εμβολιασμός', 'duration_minutes': 30})
    assert response.status_code == 201, response.text
    return response.json()


def test_no_account_can_book_complete_examination_and_retain_private_notes(client, db, registered_vet, vet_auth_header):
    card, pet = make_card(client, vet_auth_header)
    identity = db.get(PetOwner, UUID(card['pet_owner_id']))
    assert identity.email is None and identity.password_hash is None
    fake_login = {'Authorization': 'Bearer ' + create_access_token(str(identity.id), 'pet_owner')}
    assert client.get('/api/v1/owner/pets', headers=fake_login).status_code == 401
    visit = create_visit(client, db, registered_vet, vet_auth_header, pet)
    response = client.post(f"/api/v1/vet/appointments/{visit['id']}/complete", headers=vet_auth_header,
                           json={'diagnosis': 'Vaccine recorded', 'examination_notes': 'Clinical instructions', 'medications': []})
    assert response.status_code == 200, response.text
    history = client.get(f"/api/v1/vet/patients/{pet['pet_id']}/history", headers=vet_auth_header)
    assert history.status_code == 200
    assert history.json()['items'][0]['notes'] == 'Clinical instructions'
    assert 'PRIVATE' not in history.text
    assert client.delete(f"/api/v1/vet/clients/{card['id']}", headers=vet_auth_header).status_code == 409
    other = _make_vet(db)
    assert client.get(f"/api/v1/vet/patients/{pet['pet_id']}", headers=_vet_headers(other)).status_code == 404
    assert client.post(f"/api/v1/vet/clients/{card['id']}/invite", headers=vet_auth_header).status_code == 400


def test_new_signup_claims_after_verification_with_same_pet_and_history(client, db, registered_vet, vet_auth_header):
    card, pet = make_card(client, vet_auth_header, 'clinic-claim@example.com')
    visit = create_visit(client, db, registered_vet, vet_auth_header, pet)
    response = client.post(f"/api/v1/vet/appointments/{visit['id']}/complete", headers=vet_auth_header,
                           json={'diagnosis': 'Vaccination', 'examination_notes': 'Follow-up instructions',
                                 'medications': [{'name': 'Test medication', 'dosage': 'Test dose', 'frequency': 'daily', 'duration_days': 5}]})
    assert response.status_code == 200, response.text
    assert client.post(f"/api/v1/vet/clients/{card['id']}/invite", headers=vet_auth_header).status_code == 200
    record = db.get(VetClient, UUID(card['id'])); db.refresh(record)
    token = record.invite_token
    response = client.post(f'/api/v1/invite/{token}/register', json={
        'name': 'Joined Guardian', 'email': record.email, 'password': 'SafePass123!'})
    assert response.status_code == 200, response.text
    db.refresh(record)
    assert record.status == 'invited' and str(record.pet_owner_id) == card['pet_owner_id']
    owner = db.get(PetOwner, record.pending_owner_id)
    assert owner and not owner.email_verified
    response = client.post('/api/v1/auth/verify-email', json={
        'token': create_email_verification_token(str(owner.id), 'pet_owner')})
    assert response.status_code == 200, response.text
    headers = {'Authorization': 'Bearer ' + response.json()['access_token']}
    db.expire_all()
    assert record.status == 'linked' and record.pet_owner_id == owner.id
    assert db.get(Pet, UUID(pet['pet_id'])).pet_owner_id == owner.id
    assert db.get(Appointment, UUID(visit['id'])).pet_owner_id == owner.id
    assert db.scalar(select(Reminder).where(Reminder.pet_id == UUID(pet['pet_id']))).pet_owner_id == owner.id
    assert db.scalar(select(Notification).where(Notification.pet_owner_id == owner.id)) is not None
    pets = client.get('/api/v1/owner/pets', headers=headers)
    assert [p['id'] for p in pets.json()['items']] == [pet['pet_id']]
    assert 'PRIVATE' not in pets.text
    history = client.get(f"/api/v1/owner/pets/{pet['pet_id']}/medical-history", headers=headers)
    assert history.status_code == 200 and history.json()['items'][0]['notes'] == 'Follow-up instructions'
    assert 'PRIVATE' not in history.text
    medicines = client.get('/api/v1/owner/medications', headers=headers)
    assert medicines.status_code == 200 and medicines.json()['items'][0]['name'] == 'Test medication'
    assert db.get(VetClientPet, UUID(pet['id'])).notes == 'PRIVATE PET NOTE'
    assert record.notes == 'PRIVATE CLIENT NOTE'
    assert client.post(f'/api/v1/invite/{token}/accept', headers=headers).status_code == 404
    detail = client.get(f"/api/v1/vet/clients/{card['id']}", headers=vet_auth_header).json()
    assert detail['linked_pets'][0]['id'] == pet['pet_id']


def test_existing_verified_owner_accepts_without_email_autolinking(client, db, registered_owner, registered_vet, vet_auth_header, owner_auth_header):
    from tests.conftest import OWNER_DATA
    card, pet = make_card(client, vet_auth_header, registered_owner.email.upper())
    login = client.post('/api/v1/auth/pet-owner/login', json={'email': card['email'], 'password': OWNER_DATA['password']})
    assert login.status_code == 200, login.text
    unrelated = Pet(pet_owner_id=registered_owner.id, name='Other clinic pet', type='Dog')
    db.add(unrelated); db.commit()
    detail = client.get(f"/api/v1/vet/clients/{card['id']}", headers=vet_auth_header).json()
    assert [p['id'] for p in detail['linked_pets']] == [pet['pet_id']]
    client.post(f"/api/v1/vet/clients/{card['id']}/invite", headers=vet_auth_header)
    record = db.get(VetClient, UUID(card['id'])); db.refresh(record)
    response = client.post(f'/api/v1/invite/{record.invite_token}/accept', headers=owner_auth_header)
    assert response.status_code == 200, response.text
    db.expire_all()
    assert record.pet_owner_id == registered_owner.id
    detail = client.get(f"/api/v1/vet/clients/{card['id']}", headers=vet_auth_header).json()
    assert [p['id'] for p in detail['linked_pets']] == [pet['pet_id']]


def test_wrong_or_expired_invitation_cannot_move_patient(client, db, registered_owner, vet_auth_header, owner_auth_header):
    card, pet = make_card(client, vet_auth_header, 'different@example.com')
    client.post(f"/api/v1/vet/clients/{card['id']}/invite", headers=vet_auth_header)
    record = db.get(VetClient, UUID(card['id'])); db.refresh(record)
    token = record.invite_token
    assert client.post(f'/api/v1/invite/{token}/accept', headers=owner_auth_header).status_code == 403
    record.email = registered_owner.email
    record.invite_expires_at = datetime.utcnow() - timedelta(days=1)
    db.commit()
    assert client.post(f'/api/v1/invite/{token}/accept', headers=owner_auth_header).status_code == 410
    db.expire_all()
    assert str(db.get(Pet, UUID(pet['pet_id'])).pet_owner_id) == card['pet_owner_id']


def test_clinic_pet_edits_share_identity_and_removal_keeps_history(client, db, registered_vet, vet_auth_header):
    card, pet = make_card(client, vet_auth_header)
    visit = create_visit(client, db, registered_vet, vet_auth_header, pet)
    response = client.put(f"/api/v1/vet/clients/{card['id']}/pets/{pet['id']}", headers=vet_auth_header,
                          json={'name': 'Luna Updated', 'weight': 4.5})
    assert response.status_code == 200, response.text
    db.expire_all()
    canonical = db.get(Pet, UUID(pet['pet_id']))
    assert canonical.name == 'Luna Updated' and canonical.weight == 4.5
    response = client.delete(f"/api/v1/vet/clients/{card['id']}/pets/{pet['id']}", headers=vet_auth_header)
    assert response.status_code == 204, response.text
    assert db.get(Appointment, UUID(visit['id'])) is not None
    detail = client.get(f"/api/v1/vet/clients/{card['id']}", headers=vet_auth_header).json()
    assert not detail['pets'] and not detail['linked_pets']


def test_booking_and_claim_in_parallel_keep_appointment_with_new_owner():
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from sqlalchemy import event, delete
    from app.db.session import SessionLocal
    from app.db.base import Vet
    from app.repositories.vet_client import VetClientRepository
    from app.repositories.pet import PetRepository
    from app.repositories.appointment import AppointmentRepository
    from app.services.client_claim import claim_client
    from tests.test_appointments import _make_owner
    from uuid import uuid4

    vet_id = source_id = owner_id = None
    try:
        with SessionLocal() as setup:
            vet_id = _make_vet(setup).id
            owner = _make_owner(setup)
            owner.email_verified = True
            owner_id = owner.id
            repo = VetClientRepository(setup)
            card = repo.create(vet_id, 'Concurrent card', email=owner.email)
            source_id = card.pet_owner_id
            pet = repo.add_pet(card.id, 'Concurrent pet', 'Cat')
            card_id, pet_id = card.id, pet.pet_id
            token = uuid4().hex
            repo.update(card, invite_token=token, invite_expires_at=datetime.utcnow()+timedelta(days=1), status='invited')

        attempting_transfer = Event()
        with SessionLocal() as booking:
            locked_pet = PetRepository(booking).get_patient_by_id(pet_id, vet_id)
            assert locked_pet.pet_owner_id == source_id

            def accept():
                with SessionLocal() as claiming:
                    conn = claiming.connection()
                    def observe(conn, cursor, statement, parameters, context, executemany):
                        if statement.startswith('UPDATE pets '):
                            attempting_transfer.set()
                    event.listen(conn, 'before_cursor_execute', observe)
                    card = VetClientRepository(claiming).get_by_invite_token(token)
                    claim_client(claiming, card, claiming.get(PetOwner, owner_id))
                    claiming.commit()

            with ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(accept)
                assert attempting_transfer.wait(10)
                visit = AppointmentRepository(booking).create_appointment(
                    vet_id, source_id, pet_id, _next_weekday_at(10, 0), 'Checkup')
                visit_id = visit.id
                future.result(timeout=15)
        with SessionLocal() as check:
            assert check.get(Pet, pet_id).pet_owner_id == owner_id
            assert check.get(Appointment, visit_id).pet_owner_id == owner_id
    finally:
        with SessionLocal() as cleanup:
            if vet_id:
                cleanup.execute(delete(Vet).where(Vet.id == vet_id))
            for identity in (source_id, owner_id):
                if identity:
                    cleanup.execute(delete(PetOwner).where(PetOwner.id == identity))
            cleanup.commit()
