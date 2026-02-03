"""
Appointment repository - data access layer
"""

from uuid import UUID
from datetime import date, datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.db.base import Appointment
from app.models.appointment import AppointmentStatus


class AppointmentRepository:
    """Repository for Appointment database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, appointment_id: UUID, vet_id: UUID) -> Appointment | None:
        """Get a specific appointment by ID for a vet"""
        query = (
            select(Appointment)
            .where(
                Appointment.id == appointment_id,
                Appointment.vet_id == vet_id,
            )
            .options(joinedload(Appointment.pet), joinedload(Appointment.user))
        )
        return self.db.scalar(query)

    def get_vet_appointments(
        self,
        vet_id: UUID,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Appointment], int]:
        """
        Get appointments for a vet with optional filters

        Args:
            vet_id: The vet's UUID
            status: Optional status filter
            date_from: Optional start date filter
            date_to: Optional end date filter
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (list of appointments, total count)
        """
        filters = [Appointment.vet_id == vet_id]

        if status:
            filters.append(Appointment.status == AppointmentStatus(status))

        if date_from:
            filters.append(Appointment.scheduled_at >= datetime.combine(date_from, datetime.min.time()))

        if date_to:
            filters.append(Appointment.scheduled_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))

        query = (
            select(Appointment)
            .where(and_(*filters))
            .options(joinedload(Appointment.pet), joinedload(Appointment.user))
            .order_by(Appointment.scheduled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        appointments = self.db.scalars(query).unique().all()

        count_query = select(func.count(Appointment.id)).where(and_(*filters))
        total = self.db.scalar(count_query) or 0

        return list(appointments), total

    def get_today_appointments(
        self, vet_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[list[Appointment], int]:
        """Get today's appointments for a vet"""
        today = date.today()
        tomorrow = today + timedelta(days=1)

        filters = [
            Appointment.vet_id == vet_id,
            Appointment.scheduled_at >= datetime.combine(today, datetime.min.time()),
            Appointment.scheduled_at < datetime.combine(tomorrow, datetime.min.time()),
        ]

        query = (
            select(Appointment)
            .where(and_(*filters))
            .options(joinedload(Appointment.pet), joinedload(Appointment.user))
            .order_by(Appointment.scheduled_at)
            .offset(skip)
            .limit(limit)
        )
        appointments = self.db.scalars(query).unique().all()

        count_query = select(func.count(Appointment.id)).where(and_(*filters))
        total = self.db.scalar(count_query) or 0

        return list(appointments), total

    def get_pending_appointments(
        self, vet_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[list[Appointment], int]:
        """Get pending appointment requests for a vet"""
        filters = [
            Appointment.vet_id == vet_id,
            Appointment.status == AppointmentStatus.PENDING,
        ]

        query = (
            select(Appointment)
            .where(and_(*filters))
            .options(joinedload(Appointment.pet), joinedload(Appointment.user))
            .order_by(Appointment.scheduled_at)
            .offset(skip)
            .limit(limit)
        )
        appointments = self.db.scalars(query).unique().all()

        count_query = select(func.count(Appointment.id)).where(and_(*filters))
        total = self.db.scalar(count_query) or 0

        return list(appointments), total

    def update_status(
        self, appointment: Appointment, status: AppointmentStatus, notes: str | None = None
    ) -> Appointment:
        """Update an appointment's status"""
        appointment.status = status
        if notes is not None:
            appointment.notes = notes
        self.db.commit()
        self.db.refresh(appointment)
        return appointment
