"""Mark treatments as finished once their end date has passed, run from the reminder worker."""
from datetime import datetime

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db.base import Medication
from app.services.scheduling import ATHENS


def finish_ended_medications(db: Session, now: datetime | None = None) -> int:
    """A treatment whose last day was yesterday or earlier is no longer active.

    Nothing else clears the flag, so without this an ended treatment keeps showing under
    "active treatments" for the owner and in the medical record. The last day itself still counts.
    Returns how many treatments were closed.
    """
    today = (now or datetime.now(ATHENS)).astimezone(ATHENS).date()
    result = db.execute(
        update(Medication)
        .where(Medication.is_active.is_(True), Medication.end_date.is_not(None), Medication.end_date < today)
        .values(is_active=False)
    )
    db.commit()
    return result.rowcount or 0
