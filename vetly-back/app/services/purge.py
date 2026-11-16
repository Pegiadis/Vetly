"""Permanent removal of soft-deleted pets once the retention period has passed."""
import logging
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Appointment, MedicalEvent, Medication, Pet, Reminder, VetClientPet, WeightHistory
from app.utils.upload import delete_upload

logger = logging.getLogger(__name__)

RETENTION_DAYS = 30


def purge_deleted_pets(db: Session, now: datetime | None = None) -> dict[str, int]:
    """Delete pets soft-deleted more than RETENTION_DAYS ago, with their records and photos.

    `deleted_at` is stored as naive UTC, so `now` is too. Safe to run repeatedly:
    a second run finds nothing left. Returns row counts only.
    """
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=RETENTION_DAYS)
    pets = db.scalars(select(Pet).where(Pet.deleted_at.is_not(None), Pet.deleted_at < cutoff)).all()
    counts = {"pets": 0, "medical_events": 0, "medications": 0, "weights": 0, "appointments": 0, "reminders": 0, "files": 0}
    if not pets:
        return counts

    ids = [p.id for p in pets]
    for key, model in (("medical_events", MedicalEvent), ("medications", Medication), ("weights", WeightHistory),
                       ("appointments", Appointment), ("reminders", Reminder)):
        counts[key] = db.scalar(select(func.count()).select_from(model).where(model.pet_id.in_(ids))) or 0
    photos = [url for p in pets for url in (p.image_url, p.cover_image_url) if url]
    counts["pets"] = len(pets)

    # A clinic's record of the patient points at the pet with RESTRICT, so it goes first.
    for link in db.scalars(select(VetClientPet).where(VetClientPet.pet_id.in_(ids))).all():
        db.delete(link)
    db.flush()
    for pet in pets:
        db.delete(pet)
    db.commit()

    for url in photos:
        try:
            delete_upload(url)
            counts["files"] += 1
        except OSError:
            logger.warning("Could not remove an uploaded photo during purge")
    logger.info("Purged soft-deleted pets: %s", counts)
    return counts
