"""Day-before appointment reminders sent by the worker."""
from datetime import datetime, timedelta

from sqlalchemy import select

from app.db.base import Notification
from app.models.appointment import AppointmentStatus
from app.services.appointment_reminders import send_appointment_reminders
from app.services.scheduling import ATHENS

from tests.test_billing_and_completion import _appointment, sent_emails, world  # noqa: F401


def _local_now():
    return datetime.now(ATHENS).replace(tzinfo=None)


def _booked_long_ago(db, appointment):
    appointment.created_at = datetime.utcnow() - timedelta(days=3)
    db.commit()


def _run(db, owner):
    """Run the job and return how many reminders it created for this owner.

    The suite shares the developer database, which may hold other visits in the window."""
    before = len(_reminders(db, owner))
    send_appointment_reminders(db)
    return len(_reminders(db, owner)) - before


def _reminders(db, owner):
    return db.scalars(select(Notification).where(
        Notification.pet_owner_id == owner.id, Notification.type == "appointment_reminder")).all()


def test_confirmed_visit_tomorrow_is_reminded_once(db, world, sent_emails):
    vet, owner, pet = world
    appointment = _appointment(db, vet, owner, pet, when=_local_now() + timedelta(hours=20))
    _booked_long_ago(db, appointment)

    assert _run(db, owner) == 1
    assert _run(db, owner) == 0  # the worker runs every minute

    notes = _reminders(db, owner)
    assert len(notes) == 1 and notes[0].appointment_id == appointment.id
    assert pet.name in notes[0].message
    assert [to for to, _ in sent_emails].count(owner.email) == 1


def test_no_reminder_for_other_states_or_times(db, world, sent_emails):
    vet, owner, pet = world
    pending = _appointment(db, vet, owner, pet, status=AppointmentStatus.PENDING, when=_local_now() + timedelta(hours=20))
    far = _appointment(db, vet, owner, pet, when=_local_now() + timedelta(days=3))
    past = _appointment(db, vet, owner, pet, when=_local_now() - timedelta(hours=2))
    for appointment in (pending, far, past):
        _booked_long_ago(db, appointment)
    # Booked a few hours before the visit: the booking itself is the reminder.
    _appointment(db, vet, owner, pet, when=_local_now() + timedelta(hours=5))

    assert _run(db, owner) == 0
    assert _reminders(db, owner) == [] and owner.email not in [to for to, _ in sent_emails]


def test_rescheduled_visit_is_reminded_again(db, world, sent_emails):
    vet, owner, pet = world
    appointment = _appointment(db, vet, owner, pet, when=_local_now() + timedelta(hours=20))
    _booked_long_ago(db, appointment)
    assert _run(db, owner) == 1

    appointment.scheduled_at = _local_now() + timedelta(hours=22)
    db.commit()
    assert _run(db, owner) == 1
    assert len(_reminders(db, owner)) == 2


def test_owner_who_turned_off_appointment_emails_gets_only_the_notification(db, world, sent_emails):
    vet, owner, pet = world
    owner.email_appointments = False
    appointment = _appointment(db, vet, owner, pet, when=_local_now() + timedelta(hours=20))
    _booked_long_ago(db, appointment)

    assert _run(db, owner) == 1
    assert len(_reminders(db, owner)) == 1 and owner.email not in [to for to, _ in sent_emails]
