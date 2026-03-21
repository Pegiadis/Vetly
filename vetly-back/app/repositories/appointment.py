"""
Appointment repository - data access layer
"""

from uuid import UUID
from datetime import date, datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.db.base import Appointment, MedicalEvent, Medication, Pet
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency


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
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
        )
        return self.db.scalar(query)

    def has_conflicting_appointment(
        self, vet_id: UUID, scheduled_at: datetime, duration_minutes: int
    ) -> bool:
        """Check if a vet already has an active appointment overlapping the given slot"""
        slot_start = scheduled_at
        slot_end = scheduled_at + timedelta(minutes=duration_minutes)
        day_start = scheduled_at.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        query = (
            select(Appointment)
            .where(
                and_(
                    Appointment.vet_id == vet_id,
                    Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
                    Appointment.scheduled_at >= day_start,
                    Appointment.scheduled_at < day_end,
                )
            )
        )
        existing = self.db.scalars(query).all()
        for apt in existing:
            apt_start = apt.scheduled_at
            apt_end = apt_start + timedelta(minutes=apt.duration_minutes or 30)
            if slot_start < apt_end and slot_end > apt_start:
                return True
        return False

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
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
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
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
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
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
            .order_by(Appointment.scheduled_at)
            .offset(skip)
            .limit(limit)
        )
        appointments = self.db.scalars(query).unique().all()

        count_query = select(func.count(Appointment.id)).where(and_(*filters))
        total = self.db.scalar(count_query) or 0

        return list(appointments), total

    def get_pet_by_id(self, pet_id: UUID) -> Pet | None:
        """Get a pet by ID"""
        return self.db.get(Pet, pet_id)

    def create_appointment(
        self,
        vet_id: UUID,
        pet_owner_id: UUID,
        pet_id: UUID,
        scheduled_at: datetime,
        appointment_type: str,
        duration_minutes: int = 30,
        notes: str | None = None,
        status: AppointmentStatus = AppointmentStatus.CONFIRMED,
        service_type_id: UUID | None = None,
        price: object = None,
    ) -> Appointment:
        """Create a new appointment"""
        appointment = Appointment(
            vet_id=vet_id,
            pet_owner_id=pet_owner_id,
            pet_id=pet_id,
            scheduled_at=scheduled_at,
            type=appointment_type,
            duration_minutes=duration_minutes,
            notes=notes,
            status=status,
            service_type_id=service_type_id,
            price=price,
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def get_group_appointments(self, group_id: UUID, vet_id: UUID) -> list[Appointment]:
        """Get all appointments in a group for a vet"""
        query = (
            select(Appointment)
            .where(
                Appointment.group_id == group_id,
                Appointment.vet_id == vet_id,
            )
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
        )
        return list(self.db.scalars(query).unique().all())

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

    def create_medical_event(
        self,
        pet_id: UUID,
        vet_id: UUID,
        event_date: date,
        title: str,
        event_type: str,
        notes: str | None = None,
    ) -> MedicalEvent:
        """Create a medical event record"""
        from uuid import uuid4
        event = MedicalEvent(
            id=uuid4(),
            pet_id=pet_id,
            vet_id=vet_id,
            date=event_date,
            title=title,
            event_type=event_type,
            notes=notes,
        )
        self.db.add(event)
        return event

    def create_medication(
        self,
        pet_id: UUID,
        name: str,
        dosage: str,
        frequency: MedicationFrequency,
        med_time: datetime,
        start_date: date,
        end_date: date | None = None,
        notes: str | None = None,
    ) -> Medication:
        """Create a medication record"""
        from uuid import uuid4
        medication = Medication(
            id=uuid4(),
            pet_id=pet_id,
            name=name,
            dosage=dosage,
            frequency=frequency,
            time=med_time,
            start_date=start_date,
            end_date=end_date,
            notes=notes,
            is_active=True,
        )
        self.db.add(medication)
        return medication
