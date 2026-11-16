"""
Billing (price kept on the appointment, revenue analytics) and atomic visit
completion with emails sent only after commit.
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import select, func

from app.db.base import Appointment, MedicalEvent, Medication, Notification, Reminder, ServiceType
from app.models.appointment import AppointmentStatus
from app.repositories.appointment import AppointmentRepository
from app.repositories.owner import OwnerRepository
from app.schemas.appointment import CompleteExaminationRequest
from app.services.analytics import AnalyticsService
from app.services.appointment import AppointmentService
from app.services.scheduling import ATHENS

from tests.test_appointments import _make_owner, _make_pet, _make_vet

API = "/api/v1"


class FakeBackground:
    """Stands in for FastAPI BackgroundTasks: records tasks instead of running them."""

    def __init__(self):
        self.tasks = []

    def add_task(self, func, *args, **kwargs):
        self.tasks.append((func, args, kwargs))


def _service(db, vet, name="Consultation", price="30.00", duration=30):
    service = ServiceType(
        id=uuid.uuid4(), vet_id=vet.id, name=name, price=Decimal(price),
        duration_minutes=duration, is_active=True,
    )
    db.add(service)
    db.commit()
    return service


def _appointment(db, vet, owner, pet, *, status=AppointmentStatus.CONFIRMED,
                 price=None, type="Checkup", service_type_id=None, when=None):
    appointment = Appointment(
        id=uuid.uuid4(), vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id,
        scheduled_at=when or datetime.now(ATHENS).replace(tzinfo=None) - timedelta(hours=1),
        duration_minutes=30, type=type, status=status, price=price,
        service_type_id=service_type_id,
    )
    db.add(appointment)
    db.commit()
    return appointment


@pytest.fixture()
def world(db):
    vet = _make_vet(db)
    owner = _make_owner(db)
    pet = _make_pet(db, owner.id)
    return vet, owner, pet


@pytest.fixture()
def sent_emails(monkeypatch):
    sent = []
    monkeypatch.setattr(
        "app.services.notification.send_notification_email",
        lambda to, subject, html: sent.append((to, subject)),
    )
    return sent


def _counts(db):
    return {
        "events": db.scalar(select(func.count(MedicalEvent.id))),
        "meds": db.scalar(select(func.count(Medication.id))),
        "notifications": db.scalar(select(func.count(Notification.id))),
        "reminders": db.scalar(select(func.count(Reminder.id))),
    }


# ---------------------------------------------------------------------------
# Price kept on the appointment
# ---------------------------------------------------------------------------

class TestPriceSnapshot:
    def test_owner_booking_copies_service_price(self, db, world):
        vet, owner, pet = world
        service = _service(db, vet, price="45.00")
        appointment = OwnerRepository(db).create_appointment(
            pet_owner_id=owner.id, vet_id=vet.id, pet_id=pet.id,
            scheduled_at=datetime.now(ATHENS).replace(tzinfo=None) + timedelta(days=2),
            appointment_type=service.name, duration_minutes=30,
            service_type_id=service.id,
        )
        assert appointment.price == Decimal("45.00")

        service.price = Decimal("80.00")
        db.commit()
        db.refresh(appointment)
        assert appointment.price == Decimal("45.00")

    def test_vet_created_appointment_copies_price_unless_given(self, db, world):
        vet, owner, pet = world
        service = _service(db, vet, price="45.00")
        repo = AppointmentRepository(db)
        when = datetime.now(ATHENS).replace(tzinfo=None) + timedelta(days=2)
        copied = repo.create_appointment(
            vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id, scheduled_at=when,
            appointment_type="Checkup", service_type_id=service.id,
        )
        explicit = repo.create_appointment(
            vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id,
            scheduled_at=when + timedelta(hours=1), appointment_type="Checkup",
            service_type_id=service.id, price=Decimal("20.00"),
        )
        assert copied.price == Decimal("45.00")
        assert explicit.price == Decimal("20.00")

    def test_approve_fills_missing_price_and_accepts_override(self, db, world):
        vet, owner, pet = world
        service = _service(db, vet, price="45.00")
        pending = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING,
                               service_type_id=service.id)
        out = AppointmentService(db).approve_appointment(pending.id, vet.id)
        assert out.price == Decimal("45.00")

        other = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING,
                             service_type_id=service.id, price=Decimal("45.00"))
        out = AppointmentService(db).approve_appointment(other.id, vet.id, price=Decimal("50.00"))
        assert out.price == Decimal("50.00")


# ---------------------------------------------------------------------------
# Completion
# ---------------------------------------------------------------------------

class TestCompletion:
    def test_complete_records_everything_and_final_price(self, db, world, sent_emails):
        vet, owner, pet = world
        service = _service(db, vet, price="45.00")
        apt = _appointment(db, vet, owner, pet, price=Decimal("45.00"),
                           service_type_id=service.id)
        background = FakeBackground()
        before = _counts(db)

        out = AppointmentService(db, background).complete_examination(
            apt.id, vet.id,
            CompleteExaminationRequest(
                diagnosis="Otitis", price=Decimal("60.00"),
                medications=[{"name": "Drops", "dosage": "2", "frequency": "daily"}],
            ),
        )

        after = _counts(db)
        assert out.status == "completed"
        assert out.price == Decimal("60.00")
        assert after["events"] == before["events"] + 1
        assert after["meds"] == before["meds"] + 1
        assert after["notifications"] == before["notifications"] + 1
        # The email is handed to the background tasks, not sent in the request
        assert sent_emails == []
        assert len(background.tasks) == 1
        func, args, _ = background.tasks[0]
        func(*args)
        assert len(sent_emails) == 1

    def test_complete_keeps_booked_price_when_none_given(self, db, world):
        vet, owner, pet = world
        apt = _appointment(db, vet, owner, pet, price=Decimal("45.00"))
        out = AppointmentService(db).complete_examination(
            apt.id, vet.id, CompleteExaminationRequest(diagnosis="Healthy")
        )
        assert out.price == Decimal("45.00")

    def test_failure_in_late_step_writes_nothing_and_sends_nothing(
        self, db, world, sent_emails, monkeypatch
    ):
        vet, owner, pet = world
        apt = _appointment(db, vet, owner, pet, type="Εμβολιασμός", price=Decimal("20.00"))
        apt_id = apt.id
        before = _counts(db)

        def boom(*args, **kwargs):
            raise RuntimeError("reminder step failed")

        monkeypatch.setattr(
            "app.services.reminder.ReminderService.auto_create_vaccination_reminder", boom
        )
        background = FakeBackground()
        with pytest.raises(RuntimeError):
            AppointmentService(db, background).complete_examination(
                apt_id, vet.id,
                CompleteExaminationRequest(
                    diagnosis="Rabies", price=Decimal("99.00"),
                    medications=[{"name": "Drops", "dosage": "2", "frequency": "daily"}],
                ),
            )

        db.expire_all()
        assert _counts(db) == before
        stored = db.get(Appointment, apt_id)
        assert stored.status == AppointmentStatus.CONFIRMED
        assert stored.price == Decimal("20.00")
        assert background.tasks == []
        assert sent_emails == []

    def test_failure_when_notifying_rolls_back_too(self, db, world, monkeypatch):
        vet, owner, pet = world
        apt = _appointment(db, vet, owner, pet)
        apt_id = apt.id
        before = _counts(db)

        def boom(*args, **kwargs):
            raise RuntimeError("notification failed")

        monkeypatch.setattr("app.services.notification.NotificationService.notify_owner", boom)
        with pytest.raises(RuntimeError):
            AppointmentService(db).complete_examination(
                apt_id, vet.id, CompleteExaminationRequest(diagnosis="Healthy")
            )
        db.expire_all()
        assert _counts(db) == before
        assert db.get(Appointment, apt_id).status == AppointmentStatus.CONFIRMED

    def test_failing_mail_server_does_not_break_the_request(
        self, client, db, world, vet_auth_header, registered_vet, monkeypatch
    ):
        _, owner, pet = world
        apt = _appointment(db, registered_vet, owner, pet)
        calls = []

        def failing_send(*args, **kwargs):
            calls.append(args)
            raise ConnectionError("smtp down")

        monkeypatch.setattr("app.services.notification.send_notification_email", failing_send)
        res = client.post(
            f"{API}/vet/appointments/{apt.id}/complete",
            json={"diagnosis": "Healthy", "price": "35.50"},
            headers=vet_auth_header,
        )
        assert res.status_code == 200, res.text
        assert res.json()["status"] == "completed"
        assert Decimal(str(res.json()["price"])) == Decimal("35.50")
        assert len(calls) == 1  # attempted after the response, error swallowed

    def test_complete_twice_is_rejected(self, db, world):
        vet, owner, pet = world
        apt = _appointment(db, vet, owner, pet)
        service = AppointmentService(db)
        service.complete_examination(apt.id, vet.id, CompleteExaminationRequest(diagnosis="a"))
        with pytest.raises(Exception) as err:
            service.complete_examination(apt.id, vet.id, CompleteExaminationRequest(diagnosis="a"))
        assert getattr(err.value, "status_code", None) == 400


class TestLifecycleEmails:
    def test_reject_and_reschedule_queue_emails_after_commit(self, db, world, sent_emails):
        vet, owner, pet = world
        background = FakeBackground()
        pending = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING)
        AppointmentService(db, background).reject_appointment(pending.id, vet.id, "full")
        assert sent_emails == []
        assert len(background.tasks) == 1

    def test_vet_cancel_notifies_owner(self, db, world):
        vet, owner, pet = world
        apt = _appointment(db, vet, owner, pet)
        before = _counts(db)["notifications"]
        from app.schemas.appointment import AppointmentStatusUpdate
        AppointmentService(db).update_status(
            apt.id, vet.id, AppointmentStatusUpdate(status="cancelled")
        )
        assert _counts(db)["notifications"] == before + 1


# ---------------------------------------------------------------------------
# Revenue
# ---------------------------------------------------------------------------

class TestRevenue:
    def test_counts_completed_only_and_groups(self, db, world):
        vet, owner, pet = world
        now = datetime.now(ATHENS).replace(tzinfo=None)
        _appointment(db, vet, owner, pet, status=AppointmentStatus.COMPLETED,
                     price=Decimal("40.00"), type="Checkup")
        _appointment(db, vet, owner, pet, status=AppointmentStatus.COMPLETED,
                     price=Decimal("20.00"), type="Checkup")
        _appointment(db, vet, owner, pet, status=AppointmentStatus.COMPLETED,
                     price=Decimal("100.00"), type="Surgery",
                     when=now - timedelta(days=70))
        _appointment(db, vet, owner, pet, status=AppointmentStatus.COMPLETED,
                     price=None, type="Checkup")
        _appointment(db, vet, owner, pet, status=AppointmentStatus.CANCELLED,
                     price=Decimal("500.00"))
        _appointment(db, vet, owner, pet, status=AppointmentStatus.CONFIRMED,
                     price=Decimal("500.00"))
        _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING,
                     price=Decimal("500.00"))

        revenue = AnalyticsService(db).get_revenue(vet.id)

        assert revenue.total_revenue == 160.0
        assert revenue.completed_count == 4
        assert revenue.priced_count == 3
        assert revenue.unpriced_count == 1
        assert revenue.average_per_visit == pytest.approx(53.33)
        assert revenue.last_30_days_revenue == 60.0
        assert revenue.last_30_days_count == 2
        by_service = {i.service_type: (i.count, i.revenue) for i in revenue.by_service}
        assert by_service == {"Checkup": (2, 60.0), "Surgery": (1, 100.0)}
        assert len(revenue.by_month) == 12
        assert sum(m.revenue for m in revenue.by_month) == 160.0
        assert revenue.by_month[-1].month == now.strftime("%Y-%m")

    def test_empty_clinic(self, db, world):
        vet, _, _ = world
        revenue = AnalyticsService(db).get_revenue(vet.id)
        assert revenue.total_revenue == 0
        assert revenue.average_per_visit == 0
        assert revenue.by_service == []

    def test_endpoint_and_full_analytics_include_revenue(
        self, client, db, world, vet_auth_header, registered_vet
    ):
        _, owner, pet = world
        _appointment(db, registered_vet, owner, pet, status=AppointmentStatus.COMPLETED,
                     price=Decimal("45.00"))
        res = client.get(f"{API}/vet/analytics/revenue", headers=vet_auth_header)
        assert res.status_code == 200
        assert res.json()["total_revenue"] == 45.0
        full = client.get(f"{API}/vet/analytics", headers=vet_auth_header).json()
        assert full["revenue"]["total_revenue"] == 45.0


def test_future_visit_cannot_be_completed(client, db):
    """Completing a visit before its day is refused and leaves it untouched."""
    from tests.test_appointments import _make_owner, _make_pet, _make_vet, _vet_headers, WEEKDAY_HOURS
    from app.models.appointment import Appointment, AppointmentStatus

    vet = _make_vet(db, hours=WEEKDAY_HOURS)
    owner = _make_owner(db)
    pet = _make_pet(db, owner.id)
    appointment = Appointment(
        vet_id=vet.id, pet_owner_id=owner.id, pet_id=pet.id, type="Checkup", duration_minutes=30,
        status=AppointmentStatus.CONFIRMED,
        scheduled_at=datetime.now(ATHENS).replace(tzinfo=None) + timedelta(days=2),
    )
    db.add(appointment)
    db.commit()

    response = client.post(
        f"/api/v1/vet/appointments/{appointment.id}/complete",
        json={"diagnosis": "Healthy", "medications": []},
        headers=_vet_headers(vet),
    )
    assert response.status_code == 400
    assert "δεν έχει γίνει ακόμα" in response.json()["detail"]
    db.refresh(appointment)
    assert appointment.status == AppointmentStatus.CONFIRMED


def test_new_clinic_gets_starter_diagnoses(client, db):
    from tests.test_appointments import _make_vet, _vet_headers

    vet = _make_vet(db)
    types = client.get("/api/v1/vet/appointments/diagnosis-types", headers=_vet_headers(vet)).json()["types"]
    assert "Προληπτικός έλεγχος" in types and len(types) >= 8
