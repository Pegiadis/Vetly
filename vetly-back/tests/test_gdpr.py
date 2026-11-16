"""Account data export and the 30-day purge of soft-deleted pets."""
from datetime import date, datetime, time, timedelta

import pytest
from sqlalchemy import select, update

import app.utils.upload as upload
from app.db.base import (
    Appointment, ChatConversation, ChatMessage, MedicalEvent, Medication, Notification, Pet,
    Reminder, Review, ServiceType, VetClient, VetClientPet, WeightHistory,
)
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency
from app.models.pet import PetType
from app.services.purge import purge_deleted_pets
from scripts.reminder_worker import run_daily_purge

API = "/api/v1"


def _owner_data(db, owner, vet):
    pet = Pet(pet_owner_id=owner.id, name="Rex", type=PetType.DOG)
    db.add(pet)
    db.flush()
    appt = Appointment(vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id, scheduled_at=datetime(2030, 1, 1, 10),
                       type="Checkup", status=AppointmentStatus.CONFIRMED)
    conv = ChatConversation(pet_owner_id=owner.id, title="Συνομιλία")
    db.add_all([appt, conv])
    db.flush()
    db.add_all([
        MedicalEvent(pet_id=pet.id, vet_id=vet.id, date=date(2030, 1, 1), title="Εμβόλιο", event_type="Vaccination"),
        Medication(pet_id=pet.id, name="Med", dosage="1", frequency=MedicationFrequency.DAILY, time=time(8), start_date=date(2030, 1, 1)),
        WeightHistory(pet_id=pet.id, weight=12.5, recorded_at=date(2030, 1, 1)),
        Review(vet_id=vet.id, pet_owner_id=owner.id, rating=5, comment="Εξαιρετικός"),
        Reminder(pet_id=pet.id, vet_id=vet.id, pet_owner_id=owner.id, type="vaccination", title="Υπενθύμιση",
                 due_date=date(2030, 2, 1), reminder_date=date(2030, 1, 20)),
        Notification(pet_owner_id=owner.id, type="appointment_confirm", title="T", message="M"),
        ChatMessage(conversation_id=conv.id, role="user", content="Γεια"),
    ])
    db.commit()
    return pet


# --- export ---

def test_owner_export_has_all_sections_and_no_secrets(client, db, registered_owner, registered_vet, owner_auth_header):
    _owner_data(db, registered_owner, registered_vet)
    resp = client.get(f"{API}/owner/settings/export", headers=owner_auth_header)
    assert resp.status_code == 200
    assert "attachment" in resp.headers["content-disposition"]
    data = resp.json()
    assert data["profile"]["email"] == registered_owner.email
    assert "password_hash" not in data["profile"] and "auth_version" not in data["profile"]
    for key in ("pets", "medical_events", "medications", "weights", "appointments", "reviews", "reminders", "notifications"):
        assert len(data[key]) == 1, key
    assert data["chat_conversations"][0]["messages"][0]["content"] == "Γεια"
    assert "password_hash" not in resp.text


def test_owner_export_only_contains_own_data(client, db, registered_owner, registered_vet, owner_auth_header):
    from app.db.base import PetOwner
    other = PetOwner(email="other@test.com", name="Other", email_verified=True)
    db.add(other)
    db.flush()
    _owner_data(db, other, registered_vet)
    data = client.get(f"{API}/owner/settings/export", headers=owner_auth_header).json()
    assert data["pets"] == [] and data["appointments"] == [] and data["reviews"] == []


def test_vet_export(client, db, registered_owner, registered_vet, vet_auth_header):
    pet = _owner_data(db, registered_owner, registered_vet)
    db.add(ServiceType(vet_id=registered_vet.id, name="Εμβολιασμός", price=20, duration_minutes=30))
    vc = VetClient(vet_id=registered_vet.id, name="Πελάτης", invite_token="secret-token")
    db.add(vc)
    db.flush()
    db.add(VetClientPet(vet_client_id=vc.id, pet_id=pet.id, name="Rex", type=PetType.DOG))
    db.commit()
    resp = client.get(f"{API}/vet/settings/export", headers=vet_auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["email"] == registered_vet.email
    assert len(data["services"]) == 1 and len(data["clients"]) == 1 and len(data["client_pets"]) == 1
    assert len(data["patients"]) == 1 and len(data["appointments"]) == 1 and len(data["medical_events"]) == 1
    assert len(data["reviews_received"]) == 1 and "pet_owner_id" not in data["reviews_received"][0]
    assert "password_hash" not in resp.text and "secret-token" not in resp.text


def test_export_requires_matching_account_and_is_rate_limited(client, owner_auth_header, vet_auth_header):
    assert client.get(f"{API}/owner/settings/export").status_code == 401
    assert client.get(f"{API}/owner/settings/export", headers=vet_auth_header).status_code == 401
    assert client.get(f"{API}/vet/settings/export", headers=owner_auth_header).status_code == 401
    codes = [client.get(f"{API}/vet/settings/export", headers=vet_auth_header).status_code for _ in range(6)]
    assert codes[:5] == [200] * 5 and codes[5] == 429


# --- purge ---

NOW = datetime(2031, 6, 1, 12, 0)


@pytest.fixture()
def no_other_deleted_pets(db):
    """The local database may hold real soft-deleted pets; keep them out of these runs (rolled back with the test)."""
    db.execute(update(Pet).where(Pet.deleted_at.is_not(None)).values(deleted_at=None))
    db.commit()


@pytest.fixture()
def photos(no_other_deleted_pets, tmp_path, monkeypatch):
    monkeypatch.setattr(upload, "UPLOAD_DIR", tmp_path)
    (tmp_path / "pets").mkdir()
    files = {}
    for name in ("old.jpg", "old_cover.jpg", "fresh.jpg"):
        (tmp_path / "pets" / name).write_bytes(b"x")
        files[name] = f"/uploads/pets/{name}"
    return tmp_path, files


def test_purge_removes_only_expired_pets_with_records_and_photos(db, registered_owner, registered_vet, photos):
    root, files = photos
    old = _owner_data(db, registered_owner, registered_vet)
    old.deleted_at = NOW - timedelta(days=31)
    old.image_url, old.cover_image_url = files["old.jpg"], files["old_cover.jpg"]
    vc = VetClient(vet_id=registered_vet.id, name="Πελάτης")
    db.add(vc)
    db.flush()
    db.add(VetClientPet(vet_client_id=vc.id, pet_id=old.id, name="Rex", type=PetType.DOG))
    fresh = Pet(pet_owner_id=registered_owner.id, name="Fresh", type=PetType.CAT, deleted_at=NOW - timedelta(days=29), image_url=files["fresh.jpg"])
    live = Pet(pet_owner_id=registered_owner.id, name="Live", type=PetType.CAT)
    db.add_all([fresh, live])
    db.commit()
    old_id, fresh_id, live_id = old.id, fresh.id, live.id

    counts = purge_deleted_pets(db, now=NOW)
    assert counts["pets"] == 1 and counts["medical_events"] == 1 and counts["appointments"] == 1
    assert counts["files"] == 2
    db.expire_all()
    assert db.get(Pet, old_id) is None
    assert db.get(Pet, fresh_id) is not None and db.get(Pet, live_id) is not None
    assert db.scalars(select(Appointment).where(Appointment.pet_id == old_id)).all() == []
    assert db.scalars(select(WeightHistory).where(WeightHistory.pet_id == old_id)).all() == []
    assert db.scalars(select(MedicalEvent).where(MedicalEvent.pet_id == old_id)).all() == []
    assert db.scalars(select(Medication).where(Medication.pet_id == old_id)).all() == []
    assert db.scalars(select(Reminder).where(Reminder.pet_id == old_id)).all() == []
    assert db.scalars(select(VetClientPet).where(VetClientPet.pet_id == old_id)).all() == []
    assert not (root / "pets" / "old.jpg").exists() and not (root / "pets" / "old_cover.jpg").exists()
    assert (root / "pets" / "fresh.jpg").exists()
    # The clinic's client and the review survive; only the pet's records go.
    assert db.get(VetClient, vc.id) is not None


def test_purge_is_idempotent_and_boundary_exact(db, registered_owner, photos):
    pet = Pet(pet_owner_id=registered_owner.id, name="Edge", type=PetType.DOG, deleted_at=NOW - timedelta(days=30))
    db.add(pet)
    db.commit()
    assert purge_deleted_pets(db, now=NOW)["pets"] == 0  # exactly 30 days is not yet past retention
    assert purge_deleted_pets(db, now=NOW + timedelta(seconds=1))["pets"] == 1
    assert purge_deleted_pets(db, now=NOW + timedelta(days=5)) == {k: 0 for k in ("pets", "medical_events", "medications", "weights", "appointments", "reminders", "files")}


def test_worker_runs_purge_once_per_day(db, registered_owner, photos):  # photos also isolates other rows
    def add_expired():
        db.add(Pet(pet_owner_id=registered_owner.id, name="Old", type=PetType.DOG, deleted_at=NOW - timedelta(days=60)))
        db.commit()

    add_expired()
    day = run_daily_purge(db, None, now=NOW)
    assert day == NOW.date()
    assert db.scalars(select(Pet).where(Pet.name == "Old")).all() == []
    add_expired()
    assert run_daily_purge(db, day, now=NOW + timedelta(hours=3)) == day  # same day: skipped
    assert len(db.scalars(select(Pet).where(Pet.name == "Old")).all()) == 1
    assert run_daily_purge(db, day, now=NOW + timedelta(days=1)) == (NOW + timedelta(days=1)).date()
    assert db.scalars(select(Pet).where(Pet.name == "Old")).all() == []
