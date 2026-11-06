"""Shared booking rules. Existing appointment timestamps are Athens wall time."""
from datetime import datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select

from app.db.base import Appointment, Vet, ServiceType
from app.models.appointment import AppointmentStatus

ATHENS = ZoneInfo("Europe/Athens")


def appointment_time(value: datetime) -> datetime:
    return value.astimezone(ATHENS).replace(tzinfo=None) if value.tzinfo else value


def validate_future(value: datetime) -> datetime:
    value = appointment_time(value)
    if value <= datetime.now(ATHENS).replace(tzinfo=None):
        raise ValueError("Η ημερομηνία πρέπει να είναι στο μέλλον.")
    return value


def check_service(db, vet_id, service_id, duration_minutes):
    if service_id is None:
        return
    service = db.scalar(select(ServiceType).where(
        ServiceType.id == service_id, ServiceType.vet_id == vet_id,
        ServiceType.is_active.is_(True),
    ))
    if service is None:
        raise HTTPException(404, "Η υπηρεσία δεν είναι διαθέσιμη για αυτόν τον κτηνίατρο.")
    if service.duration_minutes != duration_minutes:
        raise HTTPException(400, "Η διάρκεια πρέπει να αντιστοιχεί στην επιλεγμένη υπηρεσία.")


def check_working_hours(vet, scheduled_at: datetime, duration_minutes: int) -> None:
    if not vet.hours:
        raise HTTPException(400, "Δεν έχει οριστεί ωράριο για αυτόν τον κτηνίατρο.")
    start = appointment_time(scheduled_at)
    end = start + timedelta(minutes=duration_minutes)
    day = vet.hours.get(start.strftime("%A").lower()) or {}
    shifts = [day.get("morning"), day.get("afternoon")] if "morning" in day or "afternoon" in day else [day]
    if not day.get("closed"):
        for shift in shifts:
            if not shift or not shift.get("open") or not shift.get("close"):
                continue
            opens = datetime.combine(start.date(), datetime.strptime(shift["open"], "%H:%M").time())
            closes = datetime.combine(start.date(), datetime.strptime(shift["close"], "%H:%M").time())
            if opens <= start < end <= closes:
                return
    raise HTTPException(400, "Το ραντεβού πρέπει να ολοκληρώνεται εντός του ωραρίου του κτηνιάτρου.")


def has_conflict(db, vet_id: UUID, scheduled_at: datetime, duration_minutes: int,
                 exclude_id: UUID | None = None) -> bool:
    # Serialize slot checks and writes per vet, including initially empty calendars.
    # The caller must retain this transaction until the appointment is saved.
    db.execute(select(Vet.id).where(Vet.id == vet_id).with_for_update()).scalar_one()
    start = appointment_time(scheduled_at)
    end = start + timedelta(minutes=duration_minutes)
    query = select(Appointment).where(
        Appointment.vet_id == vet_id,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        Appointment.scheduled_at < end,
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)
    for item in db.scalars(query).all():
        if start < item.scheduled_at + timedelta(minutes=item.duration_minutes or 30):
            return True
    return False
