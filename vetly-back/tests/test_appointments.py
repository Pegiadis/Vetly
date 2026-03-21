"""
Integration tests for appointment business logic.

Tests cover booking, cancellation, status transitions, and rescheduling
through real HTTP calls via FastAPI TestClient.
"""

import json
import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.db.base import Vet, PetOwner, Pet, Appointment
from app.models.appointment import AppointmentStatus
from app.core.security import get_password_hash, create_access_token

API = "/api/v1"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _next_weekday_at(hour: int, minute: int, weekday: int = 0) -> datetime:
    """
    Return the next occurrence of *weekday* (0=Mon) at the given time,
    guaranteed to be at least 4 hours from now so it passes the
    2-hour cancellation window and future-date validators.
    """
    now = datetime.utcnow()
    days_ahead = (weekday - now.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    target = now + timedelta(days=days_ahead)
    result = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if result <= now + timedelta(hours=4):
        result += timedelta(weeks=1)
    return result


def _next_saturday_at(hour: int, minute: int) -> datetime:
    """Return next Saturday at the given time (weekday 5)."""
    return _next_weekday_at(hour, minute, weekday=5)


def _make_vet(db: Session, *, hours=None, **overrides) -> Vet:
    """Insert a verified vet with optional working hours."""
    defaults = dict(
        id=uuid.uuid4(),
        email=f"vet_{uuid.uuid4().hex[:8]}@test.gr",
        password_hash=get_password_hash("TestPass123"),
        name="Dr. Test Vet",
        slug=f"dr-test-vet-{uuid.uuid4().hex[:6]}",
        specialty="General Practice",
        license_number=f"LIC-{uuid.uuid4().hex[:8]}",
        phone="2101234567",
        address="Test Address 1",
        city="Athens",
        is_verified=True,
        email_verified=True,
        is_on_call=False,
        hours=hours,
    )
    defaults.update(overrides)
    # PostgreSQL JSONB accepts Python dicts directly
    vet = Vet(**defaults)
    db.add(vet)
    db.commit()
    db.refresh(vet)
    return vet


def _make_owner(db: Session, **overrides) -> PetOwner:
    """Insert a verified pet owner."""
    defaults = dict(
        id=uuid.uuid4(),
        email=f"owner_{uuid.uuid4().hex[:8]}@test.gr",
        password_hash=get_password_hash("TestPass123"),
        name="Test Owner",
        phone="6901234567",
        email_verified=True,
    )
    defaults.update(overrides)
    owner = PetOwner(**defaults)
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner


def _make_pet(db: Session, owner_id: uuid.UUID, **overrides) -> Pet:
    """Insert a pet for the given owner."""
    defaults = dict(
        id=uuid.uuid4(),
        pet_owner_id=owner_id,
        name="Buddy",
        type="Dog",
        breed="Labrador",
        age=3,
        weight=25.0,
        gender="Male",
    )
    defaults.update(overrides)
    pet = Pet(**defaults)
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


def _owner_headers(owner: PetOwner) -> dict:
    token = create_access_token(subject=str(owner.id), token_type="pet_owner")
    return {"Authorization": f"Bearer {token}"}


def _vet_headers(vet: Vet) -> dict:
    token = create_access_token(subject=str(vet.id), token_type="vet")
    return {"Authorization": f"Bearer {token}"}


WEEKDAY_HOURS = {
    "monday": {"open": "09:00", "close": "18:00", "closed": False},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": False},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
    "thursday": {"open": "09:00", "close": "18:00", "closed": False},
    "friday": {"open": "09:00", "close": "18:00", "closed": False},
    "saturday": {"closed": True},
    "sunday": {"closed": True},
}


# ===================================================================
# BOOKING TESTS
# ===================================================================


class TestBooking:
    """Tests for appointment creation."""

    def test_create_appointment_success(self, client, db):
        """Owner can book an appointment with a vet during working hours."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        scheduled = _next_weekday_at(10, 0, weekday=0)  # Monday 10:00

        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )

        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["status"] == "pending"
        assert data["vet_id"] == str(vet.id)
        assert data["pet_id"] == str(pet.id)

    def test_create_appointment_past_date_rejected(self, client, db):
        """Booking in the past must fail with a 422 validation error."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        past = datetime.utcnow() - timedelta(hours=1)

        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": past.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )

        assert resp.status_code == 422

    def test_create_appointment_conflict_rejected(self, client, db):
        """Booking the same vet at the same time twice must conflict."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        pet2 = _make_pet(db, owner.id, name="Max")
        scheduled = _next_weekday_at(11, 0, weekday=1)  # Tuesday 11:00

        # First booking succeeds
        resp1 = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp1.status_code == 201

        # Second booking at the same time should conflict
        resp2 = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet2.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Vaccination",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp2.status_code == 409

    def test_create_appointment_outside_working_hours_rejected(self, client, db):
        """Booking outside the vet's working hours must be rejected."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        # Saturday is closed
        scheduled_sat = _next_saturday_at(10, 0)
        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled_sat.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 400

    def test_create_batch_appointments_success(self, client, db):
        """Owner can book multiple pets in a single batch."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet1 = _make_pet(db, owner.id, name="Buddy")
        pet2 = _make_pet(db, owner.id, name="Max")
        scheduled = _next_weekday_at(14, 0, weekday=2)  # Wednesday 14:00

        resp = client.post(
            f"{API}/owner/appointments/batch",
            json={
                "vet_id": str(vet.id),
                "pet_ids": [str(pet1.id), str(pet2.id)],
                "scheduled_at": scheduled.isoformat(),
                "types": {str(pet1.id): "Checkup", str(pet2.id): "Vaccination"},
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )

        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert len(data) == 2
        # Both should share a group_id (since >1 pet)
        group_ids = {item["group_id"] for item in data}
        assert len(group_ids) == 1
        assert None not in group_ids

    def test_create_appointment_with_other_owners_pet_rejected(self, client, db):
        """Cannot book an appointment using another owner's pet."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        other_owner = _make_owner(db, name="Other Person")
        other_pet = _make_pet(db, other_owner.id, name="NotMyPet")
        scheduled = _next_weekday_at(10, 0, weekday=3)  # Thursday 10:00

        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(other_pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )

        assert resp.status_code == 404
        assert "Pet not found" in resp.json()["detail"]


# ===================================================================
# CANCELLATION TESTS
# ===================================================================


class TestCancellation:
    """Tests for appointment cancellation."""

    def _book(self, client, db, owner, vet, pet, scheduled):
        """Helper: book an appointment and return response JSON."""
        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    def test_cancel_appointment_success(self, client, db):
        """Owner can cancel a pending appointment that is >2h away."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        scheduled = _next_weekday_at(10, 0, weekday=0)

        apt = self._book(client, db, owner, vet, pet, scheduled)

        resp = client.post(
            f"{API}/owner/appointments/{apt['id']}/cancel",
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_cancel_completed_appointment_rejected(self, client, db):
        """Cannot cancel a completed appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        scheduled = _next_weekday_at(10, 0, weekday=0)

        apt = self._book(client, db, owner, vet, pet, scheduled)

        # Manually mark as completed via the DB
        appointment = db.get(Appointment, uuid.UUID(apt["id"]))
        appointment.status = AppointmentStatus.COMPLETED
        db.commit()

        resp = client.post(
            f"{API}/owner/appointments/{apt['id']}/cancel",
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 400

    def test_cancel_cancelled_appointment_rejected(self, client, db):
        """Cannot cancel an already cancelled appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)
        scheduled = _next_weekday_at(10, 0, weekday=0)

        apt = self._book(client, db, owner, vet, pet, scheduled)

        # Cancel once
        resp = client.post(
            f"{API}/owner/appointments/{apt['id']}/cancel",
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 200

        # Try to cancel again
        resp2 = client.post(
            f"{API}/owner/appointments/{apt['id']}/cancel",
            headers=_owner_headers(owner),
        )
        assert resp2.status_code == 400

    def test_cancel_within_2_hours_rejected(self, client, db):
        """Cannot cancel an appointment less than 2 hours from now."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        # Book an appointment far in the future first (so it passes validation)
        scheduled = _next_weekday_at(10, 0, weekday=0)
        apt = self._book(client, db, owner, vet, pet, scheduled)

        # Move the scheduled_at to 1 hour from now directly in the DB
        appointment = db.get(Appointment, uuid.UUID(apt["id"]))
        appointment.scheduled_at = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        resp = client.post(
            f"{API}/owner/appointments/{apt['id']}/cancel",
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 400


# ===================================================================
# STATUS TRANSITION TESTS
# ===================================================================


class TestStatusTransitions:
    """Tests for appointment status transitions (vet side)."""

    def _book_as_owner(self, client, db, owner, vet, pet) -> dict:
        """Book a pending appointment and return the response JSON."""
        scheduled = _next_weekday_at(10, 0, weekday=0)
        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 201
        return resp.json()

    def test_approve_appointment(self, client, db):
        """Vet can approve a pending appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet)

        resp = client.post(
            f"{API}/vet/appointments/{apt['id']}/approve",
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "confirmed"

    def test_reject_appointment(self, client, db):
        """Vet can reject a pending appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet)

        resp = client.post(
            f"{API}/vet/appointments/{apt['id']}/reject",
            json={"reason": "No availability"},
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "cancelled"

    def test_complete_examination(self, client, db):
        """Vet can complete an examination on a confirmed appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet)

        # Approve first
        client.post(
            f"{API}/vet/appointments/{apt['id']}/approve",
            headers=_vet_headers(vet),
        )

        # Complete examination
        resp = client.post(
            f"{API}/vet/appointments/{apt['id']}/complete",
            json={
                "diagnosis": "Healthy",
                "examination_notes": "All good",
                "medications": [],
            },
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "completed"

    def test_invalid_transition_completed_to_pending(self, client, db):
        """Cannot move a completed appointment back to pending."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet)

        # Approve and complete
        client.post(
            f"{API}/vet/appointments/{apt['id']}/approve",
            headers=_vet_headers(vet),
        )
        client.post(
            f"{API}/vet/appointments/{apt['id']}/complete",
            json={"diagnosis": "Healthy", "medications": []},
            headers=_vet_headers(vet),
        )

        # Try to set back to confirmed (invalid from completed)
        resp = client.patch(
            f"{API}/vet/appointments/{apt['id']}/status",
            json={"status": "confirmed"},
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 400

    def test_invalid_transition_cancelled_to_confirmed(self, client, db):
        """Cannot confirm a cancelled appointment."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet)

        # Reject the appointment (sets to cancelled)
        client.post(
            f"{API}/vet/appointments/{apt['id']}/reject",
            headers=_vet_headers(vet),
        )

        # Try to confirm (invalid from cancelled)
        resp = client.patch(
            f"{API}/vet/appointments/{apt['id']}/status",
            json={"status": "confirmed"},
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 400


# ===================================================================
# RESCHEDULE TESTS
# ===================================================================


class TestReschedule:
    """Tests for rescheduling appointments."""

    def _book_as_owner(self, client, db, owner, vet, pet, weekday=0, hour=10) -> dict:
        scheduled = _next_weekday_at(hour, 0, weekday=weekday)
        resp = client.post(
            f"{API}/owner/appointments",
            json={
                "vet_id": str(vet.id),
                "pet_id": str(pet.id),
                "scheduled_at": scheduled.isoformat(),
                "type": "Checkup",
                "duration_minutes": 30,
            },
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 201
        return resp.json()

    def test_owner_reschedule_success(self, client, db):
        """Owner can reschedule a pending appointment to a new time."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet, weekday=0, hour=10)
        new_time = _next_weekday_at(14, 0, weekday=2)  # Wednesday 14:00

        resp = client.patch(
            f"{API}/owner/appointments/{apt['id']}/reschedule",
            json={"scheduled_at": new_time.isoformat()},
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 200, resp.text
        # Owner reschedule resets to pending
        assert resp.json()["status"] == "pending"

    def test_owner_reschedule_conflict_rejected(self, client, db):
        """Owner cannot reschedule to a slot that is already taken."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet1 = _make_pet(db, owner.id, name="Buddy")
        pet2 = _make_pet(db, owner.id, name="Max")

        # Book first appointment at Tuesday 11:00
        self._book_as_owner(client, db, owner, vet, pet1, weekday=1, hour=11)

        # Book second appointment at Wednesday 14:00
        apt2 = self._book_as_owner(client, db, owner, vet, pet2, weekday=2, hour=14)

        # Try to reschedule second appointment to Tuesday 11:00 (conflict)
        conflict_time = _next_weekday_at(11, 0, weekday=1)
        resp = client.patch(
            f"{API}/owner/appointments/{apt2['id']}/reschedule",
            json={"scheduled_at": conflict_time.isoformat()},
            headers=_owner_headers(owner),
        )
        assert resp.status_code == 409

    def test_vet_reschedule_success(self, client, db):
        """Vet can reschedule an appointment (stays confirmed)."""
        vet = _make_vet(db, hours=WEEKDAY_HOURS)
        owner = _make_owner(db)
        pet = _make_pet(db, owner.id)

        apt = self._book_as_owner(client, db, owner, vet, pet, weekday=0, hour=10)

        # Approve first so it's confirmed
        client.post(
            f"{API}/vet/appointments/{apt['id']}/approve",
            headers=_vet_headers(vet),
        )

        new_time = _next_weekday_at(15, 0, weekday=3)  # Thursday 15:00

        resp = client.post(
            f"{API}/vet/appointments/{apt['id']}/reschedule",
            json={"scheduled_at": new_time.isoformat()},
            headers=_vet_headers(vet),
        )
        assert resp.status_code == 200, resp.text
        # Vet reschedule keeps it confirmed
        assert resp.json()["status"] == "confirmed"
