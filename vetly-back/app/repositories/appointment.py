"""
Appointment repository - data access layer
"""

from decimal import Decimal
from uuid import UUID
from datetime import date, datetime, timedelta
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, joinedload

from app.db.base import Appointment, MedicalEvent, Medication, Pet, PetOwner, ServiceType
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
        self, vet_id: UUID, scheduled_at: datetime, duration_minutes: int,
        exclude_id: UUID | None = None,
    ) -> bool:
        from app.services.scheduling import has_conflict
        return has_conflict(self.db, vet_id, scheduled_at, duration_minutes, exclude_id)

    def get_vet_appointments(
        self,
        vet_id: UUID,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 10,
        sort_asc: bool = False,
        search: str | None = None,
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

        if search and search.strip():
            term = search.strip()
            filters.append(or_(
                Appointment.pet.has(Pet.name.icontains(term, autoescape=True)),
                Appointment.pet_owner.has(PetOwner.name.icontains(term, autoescape=True)),
            ))

        if status:
            filters.append(Appointment.status == AppointmentStatus(status))

        if date_from:
            filters.append(Appointment.scheduled_at >= datetime.combine(date_from, datetime.min.time()))

        if date_to:
            filters.append(Appointment.scheduled_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))

        order = Appointment.scheduled_at.asc() if sort_asc else Appointment.scheduled_at.desc()
        query = (
            select(Appointment)
            .where(and_(*filters))
            .options(joinedload(Appointment.pet), joinedload(Appointment.pet_owner))
            .order_by(order)
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
        from app.services.scheduling import ATHENS
        today = datetime.now(ATHENS).date()
        tomorrow = today + timedelta(days=1)

        filters = [
            Appointment.vet_id == vet_id,
            Appointment.scheduled_at >= datetime.combine(today, datetime.min.time()),
            Appointment.scheduled_at < datetime.combine(tomorrow, datetime.min.time()),
            Appointment.status == AppointmentStatus.CONFIRMED,
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
        commit: bool = True,
    ) -> Appointment:
        """Create a new appointment.

        When a service is chosen and no price is given, the service's current
        price is copied onto the appointment so later price edits do not
        change it. commit=False only flushes, for callers that commit once.
        """
        if price is None and service_type_id is not None:
            price = self.get_service_price(service_type_id, vet_id)
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
        if commit:
            self.db.commit()
            self.db.refresh(appointment)
        else:
            self.db.flush()
        return appointment

    def get_service_price(self, service_type_id: UUID, vet_id: UUID) -> Decimal | None:
        """Current price of one of the vet's services, or None if it is not theirs."""
        return self.db.scalar(
            select(ServiceType.price).where(
                ServiceType.id == service_type_id, ServiceType.vet_id == vet_id
            )
        )

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
        self,
        appointment: Appointment,
        status: AppointmentStatus,
        notes: str | None = None,
        commit: bool = True,
    ) -> Appointment:
        """Update an appointment's status (commit=False leaves the commit to the caller)"""
        appointment.status = status
        if notes is not None:
            appointment.notes = notes
        if commit:
            self.db.commit()
            self.db.refresh(appointment)
        else:
            self.db.flush()
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
