"""Read-only operational overview, using the booking system's Athens wall time."""
from datetime import datetime, timedelta
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from app.db.base import Appointment
from app.models.appointment import AppointmentStatus as Status
from app.schemas.appointment import AppointmentDetailResponse
from app.services.scheduling import ATHENS, appointment_time


class ClinicHomeResponse(BaseModel):
    date: str
    next_appointment: AppointmentDetailResponse | None
    today_confirmed: int
    today_completed: int
    pending_total: int
    pending_today: int
    earlier_today: int
    today_items: list[AppointmentDetailResponse]
    pending_items: list[AppointmentDetailResponse]


def get_clinic_home(db: Session, vet_id: UUID, now: datetime | None = None) -> ClinicHomeResponse:
    now = appointment_time(now or datetime.now(ATHENS))
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    scope = Appointment.vet_id == vet_id
    today = [Appointment.scheduled_at >= start, Appointment.scheduled_at < end]
    confirmed = Appointment.status == Status.CONFIRMED
    pending = Appointment.status == Status.PENDING

    def count(*filters):
        return db.scalar(select(func.count()).select_from(Appointment).where(scope, *filters)) or 0

    def items(*filters, limit=6):
        query = select(Appointment).where(scope, *filters).options(
            joinedload(Appointment.pet), joinedload(Appointment.pet_owner)
        ).order_by(Appointment.scheduled_at, Appointment.id).limit(limit)
        return [AppointmentDetailResponse.model_validate(row) for row in db.scalars(query).all()]

    upcoming = items(confirmed, Appointment.scheduled_at >= now, limit=1)
    return ClinicHomeResponse(
        date=start.date().isoformat(), next_appointment=upcoming[0] if upcoming else None,
        today_confirmed=count(*today, confirmed),
        today_completed=count(*today, Appointment.status == Status.COMPLETED),
        pending_total=count(pending), pending_today=count(*today, pending),
        earlier_today=count(*today, confirmed, Appointment.scheduled_at < now),
        today_items=items(*today, confirmed), pending_items=items(*today, pending, limit=4),
    )
