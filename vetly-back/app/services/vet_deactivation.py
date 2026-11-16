"""Vet account closure. Clinical records stay; the account stops existing for everyone else."""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Appointment, Vet
from app.models.appointment import AppointmentStatus
from app.services.notification import NotificationService
from app.services.scheduling import ATHENS
from app.utils.upload import delete_upload

logger = logging.getLogger(__name__)

CANCEL_NOTE = "Ακυρώθηκε: ο κτηνίατρος έκλεισε τον λογαριασμό του στο Vetly."


def deactivate_vet(db: Session, vet: Vet, now: datetime | None = None) -> int:
    """Close the account and return how many future appointments were cancelled.

    The row is kept so medical events and appointments still name their author.
    Sign-in is blocked (no password, no email, `deactivated_at` set), sessions are
    revoked, the profile disappears from owner-facing queries, and contact details
    and the photo are cleared. Name, specialty and licence number stay as the
    professional identity attached to the records.
    """
    now = now or datetime.now(ATHENS).replace(tzinfo=None)
    upcoming = db.scalars(
        select(Appointment).where(
            Appointment.vet_id == vet.id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            Appointment.scheduled_at >= now,
        ).order_by(Appointment.scheduled_at)
    ).all()

    # One message per owner and booking, even when a multi-pet booking spans several rows.
    notices: dict[tuple, dict] = {}
    for appointment in upcoming:
        appointment.status = AppointmentStatus.CANCELLED
        appointment.notes = CANCEL_NOTE
        key = (appointment.pet_owner_id, appointment.group_id or appointment.id)
        notice = notices.setdefault(key, {"owner_id": appointment.pet_owner_id, "pets": [], "at": appointment.scheduled_at})
        if appointment.pet and appointment.pet.name not in notice["pets"]:
            notice["pets"].append(appointment.pet.name)

    photo = vet.image_url
    vet_name = vet.name
    vet.email = f"deleted-{vet.id}@deleted.invalid"
    vet.password_hash = None
    vet.auth_version += 1
    vet.phone = ""
    vet.address = ""
    vet.city = ""
    vet.description = None
    vet.image_url = None
    vet.slug = None
    vet.coordinates_lat = None
    vet.coordinates_lng = None
    vet.hours = None
    vet.custom_reminder_types = []
    vet.custom_diagnosis_types = []
    vet.custom_medication_names = []
    vet.is_on_call = False
    vet.is_verified = False
    vet.email_verified = False
    vet.deactivated_at = now
    db.commit()

    if photo:
        try:
            delete_upload(photo)
        except OSError:
            logger.exception("Vet photo cleanup failed")

    notifications = NotificationService(db)
    for notice in notices.values():
        pets = ", ".join(notice["pets"])
        notifications.notify_owner(
            notice["owner_id"],
            type="appointment_cancel",
            title="Ραντεβού ακυρώθηκε",
            message=f"Το ραντεβού σας για {pets} με {vet_name} ακυρώθηκε, επειδή ο κτηνίατρος έκλεισε τον λογαριασμό του.",
            pet_name=pets,
            date_str=notice["at"].strftime("%d/%m/%Y %H:%M"),
        )
    return len(upcoming)
