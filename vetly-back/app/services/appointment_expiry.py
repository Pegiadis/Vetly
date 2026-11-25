"""Close appointment requests the clinic never answered, run from the reminder worker."""
import logging
from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.email_templates import appointment_expired_email, send_notification_email
from app.db.base import Appointment, Notification, Pet, PetOwner, Vet
from app.models.appointment import AppointmentStatus
from app.services.scheduling import ATHENS

logger = logging.getLogger(__name__)

def expire_unanswered_requests(db: Session, now: datetime | None = None) -> int:
    """Cancel pending requests whose requested time has passed and tell the owner.

    Without this a request stays "pending" for ever: the owner keeps waiting and the vet could
    still approve a visit in the past. One notification per booking (a group booking counts once).
    Returns how many appointments were closed.
    """
    now = now or datetime.now(ATHENS)
    local_now = now.astimezone(ATHENS).replace(tzinfo=None)  # scheduled_at is clinic-local
    stale = db.scalars(
        select(Appointment).where(
            Appointment.status == AppointmentStatus.PENDING,
            Appointment.scheduled_at < local_now,
        ).order_by(Appointment.scheduled_at).with_for_update(skip_locked=True)
    ).all()
    if not stale:
        return 0

    bookings: dict[tuple, list[Appointment]] = defaultdict(list)
    for appointment in stale:
        appointment.status = AppointmentStatus.CANCELLED  # the owner's own note is left as it was
        bookings[(appointment.pet_owner_id, appointment.group_id or appointment.id)].append(appointment)

    emails = []
    for (owner_id, _), members in bookings.items():
        first = members[0]
        pets = ", ".join(pet.name for pet in (db.get(Pet, member.pet_id) for member in members) if pet)
        vet = db.get(Vet, first.vet_id)
        vet_name = vet.name if vet else ""
        date_str = first.scheduled_at.strftime("%d/%m/%Y %H:%M")
        db.add(Notification(
            pet_owner_id=owner_id, vet_id=first.vet_id, appointment_id=first.id, type="appointment_reject",
            title="Το αίτημα ραντεβού έληξε",
            message=f"Το αίτημά σας για {pets} με {vet_name} στις {date_str} έληξε χωρίς απάντηση. Μπορείτε να ζητήσετε νέα ώρα.",
            is_read=False,
        ))
        owner = db.get(PetOwner, owner_id)
        if owner and owner.email and owner.email_appointments:
            emails.append((owner.email, owner.name, vet_name, pets, date_str))
    db.commit()

    # Emails go out only after the change is saved.
    for to_email, owner_name, vet_name, pets, date_str in emails:
        try:
            subject, html = appointment_expired_email(owner_name, vet_name, pets, date_str)
            send_notification_email(to_email, subject, html)
        except Exception:
            logger.exception("Could not email an expired-request notice")
    return len(stale)
