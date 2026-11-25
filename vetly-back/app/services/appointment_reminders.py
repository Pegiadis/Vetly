"""Day-before reminders for confirmed appointments, run from the reminder worker."""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.base import Appointment, Notification, Pet, Vet
from app.models.appointment import AppointmentStatus
from app.services.notification import NotificationService
from app.services.scheduling import ATHENS

logger = logging.getLogger(__name__)

REMIND_WITHIN = timedelta(hours=24)
# A visit booked this close to its time needs no reminder: the booking is the reminder.
MIN_LEAD = timedelta(hours=12)


def send_appointment_reminders(db: Session, now: datetime | None = None) -> int:
    """Remind owners once about each confirmed visit starting within 24 hours.

    The notification's unique source_key (appointment + its time) makes this
    safe to run every minute, and a rescheduled visit gets a fresh reminder.
    Returns how many reminders were created.
    """
    now = now or datetime.now(ATHENS)
    local_now = now.astimezone(ATHENS).replace(tzinfo=None)  # scheduled_at is clinic-local
    upcoming = db.scalars(
        select(Appointment).where(
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.scheduled_at > local_now,
            Appointment.scheduled_at <= local_now + REMIND_WITHIN,
        ).order_by(Appointment.scheduled_at)
    ).all()

    created = []
    for appointment in upcoming:
        booked_local = appointment.created_at.replace(tzinfo=timezone.utc).astimezone(ATHENS).replace(tzinfo=None)
        if appointment.scheduled_at - booked_local < MIN_LEAD:
            continue
        pet = db.get(Pet, appointment.pet_id)
        vet = db.get(Vet, appointment.vet_id)
        if pet is None or pet.deleted_at is not None or vet is None:
            continue
        date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
        result = db.execute(
            insert(Notification).values(
                pet_owner_id=appointment.pet_owner_id,
                vet_id=appointment.vet_id,
                appointment_id=appointment.id,
                type="appointment_reminder",
                title="Υπενθύμιση ραντεβού",
                message=f"Το ραντεβού για {pet.name} με {vet.name} είναι στις {date_str}.",
                is_read=False,
                source_key=f"appointment_reminder:{appointment.id}:{appointment.scheduled_at.isoformat()}",
            ).on_conflict_do_nothing(index_elements=["source_key"])
        )
        if result.rowcount:
            created.append((appointment, pet.name, date_str))
    db.commit()

    # Emails go out only after the notifications are saved, so a crash cannot repeat them.
    notifications = NotificationService(db)
    for appointment, pet_name, date_str in created:
        try:
            notifications._send_owner_email(
                owner_id=appointment.pet_owner_id,
                notification_type="appointment_reminder",
                vet_id=appointment.vet_id,
                pet_name=pet_name,
                date_str=date_str,
                service=appointment.type or "",
            )
        except Exception:
            logger.exception("Appointment reminder email failed for appointment %s", appointment.id)
    return len(created)
