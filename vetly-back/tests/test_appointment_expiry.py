"""Requests the clinic never answered: they cannot be approved late and the worker closes them."""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select

from app.core.security import create_access_token
from app.db.base import Notification
from app.models.appointment import AppointmentStatus
from app.services.appointment_expiry import expire_unanswered_requests
from app.services.scheduling import ATHENS

from tests.test_billing_and_completion import _appointment, world  # noqa: F401

API = "/api/v1"


def _local_now():
    return datetime.now(ATHENS).replace(tzinfo=None)


def _headers(vet):
    return {"Authorization": f"Bearer {create_access_token(str(vet.id), token_type='vet', version=vet.auth_version)}"}


def _expiry_notes(db, owner):
    return db.scalars(select(Notification).where(
        Notification.pet_owner_id == owner.id, Notification.title == "Το αίτημα ραντεβού έληξε")).all()


def test_a_request_whose_time_passed_cannot_be_approved(client, db, world):
    vet, owner, pet = world
    late = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=_local_now() - timedelta(hours=3))
    response = client.post(f"{API}/vet/appointments/{late.id}/approve", headers=_headers(vet))
    assert response.status_code == 400 and "έχει περάσει" in response.json()["detail"]
    db.refresh(late)
    assert late.status == AppointmentStatus.PENDING

    upcoming = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=_local_now() + timedelta(days=2))
    assert client.post(f"{API}/vet/appointments/{upcoming.id}/approve", headers=_headers(vet)).status_code == 200


def test_worker_closes_unanswered_requests_once_and_tells_the_owner(db, world, monkeypatch):
    vet, owner, pet = world
    sent = []
    monkeypatch.setattr("app.services.appointment_expiry.send_notification_email", lambda to, subject, html: sent.append((to, subject)))
    late = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=_local_now() - timedelta(hours=1))
    future = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=_local_now() + timedelta(days=1))
    confirmed_past = _appointment(db, vet, owner, pet, status=AppointmentStatus.CONFIRMED, when=_local_now() - timedelta(days=1))

    expire_unanswered_requests(db)
    expire_unanswered_requests(db)  # the worker runs every minute

    for appointment in (late, future, confirmed_past):
        db.refresh(appointment)
    assert late.status == AppointmentStatus.CANCELLED
    assert future.status == AppointmentStatus.PENDING
    assert confirmed_past.status == AppointmentStatus.CONFIRMED  # the vet completes or cancels those
    notes = _expiry_notes(db, owner)
    assert len(notes) == 1 and pet.name in notes[0].message
    assert [to for to, _ in sent].count(owner.email) == 1


def test_a_group_request_is_closed_with_one_notice_and_respects_email_preference(db, world, monkeypatch):
    vet, owner, pet = world
    sent = []
    monkeypatch.setattr("app.services.appointment_expiry.send_notification_email", lambda to, subject, html: sent.append(to))
    owner.email_appointments = False
    group = uuid.uuid4()
    when = _local_now() - timedelta(hours=2)
    members = [_appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=when) for _ in range(2)]
    for member in members:
        member.group_id = group
    db.commit()

    expire_unanswered_requests(db)

    assert len(_expiry_notes(db, owner)) == 1
    assert owner.email not in sent
