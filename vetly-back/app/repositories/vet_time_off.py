"""
Repository for vet time off / closures
"""

from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Appointment, VetTimeOff
from app.models.appointment import AppointmentStatus


def closure_window(entry: VetTimeOff, day: date) -> tuple[datetime, datetime]:
    """The blocked interval of a closure on one day (the whole day when no times are set)."""
    if entry.start_time and entry.end_time:
        return datetime.combine(day, entry.start_time), datetime.combine(day, entry.end_time)
    return datetime.combine(day, datetime.min.time()), datetime.combine(day + timedelta(days=1), datetime.min.time())


def closure_overlaps(entry: VetTimeOff, start: datetime, end: datetime) -> bool:
    """True when the interval [start, end) touches the closure on any day of its range."""
    day = max(entry.start_date, start.date())
    last = min(entry.end_date, end.date())
    while day <= last:
        c_start, c_end = closure_window(entry, day)
        if start < c_end and end > c_start:
            return True
        day += timedelta(days=1)
    return False


class VetTimeOffRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_upcoming(self, vet_id: UUID, today: date) -> list[VetTimeOff]:
        return list(self.db.scalars(
            select(VetTimeOff)
            .where(VetTimeOff.vet_id == vet_id, VetTimeOff.end_date >= today)
            .order_by(VetTimeOff.start_date, VetTimeOff.start_time)
        ).all())

    def list_in_range(self, vet_id: UUID, first: date, last: date) -> list[VetTimeOff]:
        return list(self.db.scalars(
            select(VetTimeOff)
            .where(VetTimeOff.vet_id == vet_id, VetTimeOff.start_date <= last, VetTimeOff.end_date >= first)
            .order_by(VetTimeOff.start_date)
        ).all())

    def get(self, entry_id: UUID, vet_id: UUID) -> VetTimeOff | None:
        return self.db.scalar(select(VetTimeOff).where(VetTimeOff.id == entry_id, VetTimeOff.vet_id == vet_id))

    def create(self, **fields) -> VetTimeOff:
        entry = VetTimeOff(**fields)
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: VetTimeOff) -> None:
        self.db.delete(entry)
        self.db.commit()

    def find_overlapping(self, vet_id: UUID, start: datetime, end: datetime) -> VetTimeOff | None:
        for entry in self.list_in_range(vet_id, start.date(), end.date()):
            if closure_overlaps(entry, start, end):
                return entry
        return None

    def active_appointments_in(self, vet_id: UUID, entry: VetTimeOff) -> list[Appointment]:
        """Pending/confirmed appointments that fall inside the closure."""
        first = datetime.combine(entry.start_date, datetime.min.time())
        last = datetime.combine(entry.end_date + timedelta(days=1), datetime.min.time())
        candidates = self.db.scalars(
            select(Appointment).where(
                Appointment.vet_id == vet_id,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
                Appointment.scheduled_at >= first - timedelta(days=1),
                Appointment.scheduled_at < last,
            ).order_by(Appointment.scheduled_at)
        ).all()
        return [
            a for a in candidates
            if closure_overlaps(entry, a.scheduled_at, a.scheduled_at + timedelta(minutes=a.duration_minutes or 30))
        ]
