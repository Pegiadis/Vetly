"""Vet notification preferences, on-call toggle and account deactivation."""
from datetime import date, datetime, timedelta

from sqlalchemy import select

from app.core.security import create_access_token
from app.db.base import Appointment, MedicalEvent, Notification, Pet, Vet, VetClient
from app.models.appointment import AppointmentStatus
from app.models.pet import PetType
from app.services.notification import NotificationService
from tests.conftest import VET_DATA

SETTINGS = "/api/v1/vet/settings"
API = "/api/v1"


def _pet_and_appointment(db, owner, vet, *, days=2, status=AppointmentStatus.CONFIRMED):
    pet = Pet(pet_owner_id=owner.id, name="Rex", type=PetType.DOG)
    db.add(pet)
    db.flush()
    appt = Appointment(vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id,
                       scheduled_at=datetime.now() + timedelta(days=days), type="Checkup", status=status)
    db.add(appt)
    db.commit()
    return pet, appt


# --- preferences ---

def test_preferences_default_save_and_auth(client, vet_auth_header, owner_auth_header):
    body = client.get(SETTINGS, headers=vet_auth_header).json()
    assert body == {"email_new_bookings": True, "email_cancellations": True, "email_reviews": True}
    new = {"email_new_bookings": False, "email_cancellations": True, "email_reviews": False}
    assert client.put(SETTINGS, headers=vet_auth_header, json=new).json() == new
    assert client.get(SETTINGS, headers=vet_auth_header).json() == new
    assert client.put(SETTINGS, headers=vet_auth_header, json={**new, "extra": 1}).status_code == 422
    assert client.get(SETTINGS, headers=owner_auth_header).status_code == 401
    assert client.get(SETTINGS).status_code == 401


def test_vet_emails_respect_preferences(db, registered_vet, monkeypatch):
    sent = []
    monkeypatch.setattr("app.services.notification.send_notification_email", lambda *a: sent.append(a))
    service = NotificationService(db)

    def fire():
        for kind in ("appointment_new", "appointment_cancel", "appointment_reschedule", "review_new"):
            service._send_vet_email(registered_vet.id, kind, None, "Rex", "01/01/2030 10:00", "Checkup", 5, "ok")

    fire()
    assert len(sent) == 4
    sent.clear()
    registered_vet.email_new_bookings = False
    registered_vet.email_cancellations = False
    registered_vet.email_reviews = False
    db.commit()
    fire()
    assert sent == []
    registered_vet.email_reviews = True
    db.commit()
    fire()
    assert len(sent) == 1


def test_on_call_toggle_is_visible_to_owners(client, registered_vet, vet_auth_header, owner_auth_header):
    registered_vet.coordinates_lat = 37.97
    registered_vet.coordinates_lng = 23.72
    assert client.patch(f"{API}/vets/me/on-call", headers=vet_auth_header, json={"is_on_call": True}).status_code == 200
    listed = client.get(f"{API}/vets/on-call", headers=owner_auth_header).json()["items"]
    assert str(registered_vet.id) in [v["id"] for v in listed]
    client.patch(f"{API}/vets/me/on-call", headers=vet_auth_header, json={"is_on_call": False})
    listed = client.get(f"{API}/vets/on-call", headers=owner_auth_header).json()["items"]
    assert str(registered_vet.id) not in [v["id"] for v in listed]


# --- deactivation ---

def _delete(client, headers, password=VET_DATA["password"], confirmation="ΔΙΑΓΡΑΦΗ"):
    return client.post(f"{SETTINGS}/delete-account", headers=headers,
                       json={"current_password": password, "confirmation": confirmation})


def test_delete_requires_password_and_confirmation(client, db, registered_vet, vet_auth_header):
    assert _delete(client, vet_auth_header, password="wrong").status_code == 400
    assert _delete(client, vet_auth_header, confirmation="nope").status_code == 422
    db.refresh(registered_vet)
    assert registered_vet.deactivated_at is None
    assert client.get(SETTINGS, headers={"Authorization": "Bearer x"}).status_code == 401


def test_deactivation_hides_vet_blocks_login_and_keeps_records(client, db, registered_vet, registered_owner, owner_auth_header):
    slug = registered_vet.slug
    headers = {"Authorization": "Bearer " + create_access_token(subject=str(registered_vet.id), token_type="vet", version=registered_vet.auth_version)}
    pet, upcoming = _pet_and_appointment(db, registered_owner, registered_vet, days=2)
    _, pending = _pet_and_appointment(db, registered_owner, registered_vet, days=3, status=AppointmentStatus.PENDING)
    _, past = _pet_and_appointment(db, registered_owner, registered_vet, days=-3, status=AppointmentStatus.COMPLETED)
    event = MedicalEvent(pet_id=pet.id, vet_id=registered_vet.id, date=date.today(), title="Εμβόλιο", event_type="Vaccination")
    client_row = VetClient(vet_id=registered_vet.id, name="Πελάτης")
    db.add_all([event, client_row])
    db.commit()
    registered_vet.is_on_call = True
    db.commit()
    vet_id = registered_vet.id

    assert client.get(f"{API}/public/vets/{slug}").status_code == 200
    assert _delete(client, headers).status_code == 204

    db.expire_all()
    vet = db.get(Vet, vet_id)
    assert vet.deactivated_at is not None
    assert vet.password_hash is None and vet.slug is None and vet.phone == "" and vet.address == ""
    assert vet.email.endswith("@deleted.invalid") and vet.is_on_call is False and vet.is_verified is False
    assert vet.name == VET_DATA["name"]  # attribution on clinical records stays

    # Gone for owners and for the vet.
    assert client.get(f"{API}/public/vets/{slug}").status_code == 404
    assert client.get(f"{API}/public/vets/{vet_id}").status_code == 404
    assert client.get(f"{API}/vets/{vet_id}", headers=owner_auth_header).status_code == 404
    assert str(vet_id) not in [v["id"] for v in client.get(f"{API}/public/vets", headers=owner_auth_header).json()["items"]]
    assert client.get(f"{API}/vets/me", headers=headers).status_code == 401
    assert client.post(f"{API}/auth/vet/login", json={"email": VET_DATA["email"], "password": VET_DATA["password"]}).status_code == 401

    # Future appointments cancelled and owner told; past ones and clinical data untouched.
    assert db.get(Appointment, upcoming.id).status == AppointmentStatus.CANCELLED
    assert db.get(Appointment, pending.id).status == AppointmentStatus.CANCELLED
    assert db.get(Appointment, past.id).status == AppointmentStatus.COMPLETED
    notes = db.scalars(select(Notification).where(Notification.pet_owner_id == registered_owner.id, Notification.type == "appointment_cancel")).all()
    assert len(notes) == 2  # two separate bookings
    assert db.get(MedicalEvent, event.id) is not None
    assert db.get(VetClient, client_row.id) is not None
    assert db.get(Pet, pet.id) is not None


def test_deactivated_vet_gets_no_emails(db, registered_vet, monkeypatch):
    sent = []
    monkeypatch.setattr("app.services.notification.send_notification_email", lambda *a: sent.append(a))
    registered_vet.deactivated_at = datetime.utcnow()
    db.commit()
    NotificationService(db)._send_vet_email(registered_vet.id, "appointment_new", None, "Rex", "d", "s", 0, "")
    assert sent == []
