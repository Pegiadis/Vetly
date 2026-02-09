"""
Repository for pet owner related database operations
"""

from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Pet, Appointment, Vet, PetOwner
from app.models.appointment import AppointmentStatus


class OwnerRepository:
    """Repository for pet owner database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_pets_by_owner_id(self, owner_id: UUID) -> list[Pet]:
        """Get all pets for a pet owner"""
        query = select(Pet).where(Pet.pet_owner_id == owner_id).order_by(Pet.name)
        return list(self.db.scalars(query).all())

    def get_pet_by_id(self, pet_id: UUID, owner_id: UUID) -> Pet | None:
        """Get a specific pet by ID, ensuring it belongs to the owner"""
        query = select(Pet).where(Pet.id == pet_id, Pet.pet_owner_id == owner_id)
        return self.db.scalar(query)

    def get_appointments_by_owner_id(self, owner_id: UUID) -> list[Appointment]:
        """Get all appointments for a pet owner"""
        query = (
            select(Appointment)
            .where(Appointment.pet_owner_id == owner_id)
            .order_by(Appointment.scheduled_at.desc())
        )
        return list(self.db.scalars(query).all())

    def get_upcoming_appointments(self, owner_id: UUID) -> list[Appointment]:
        """Get upcoming appointments for a pet owner"""
        now = datetime.utcnow()
        query = (
            select(Appointment)
            .where(
                Appointment.pet_owner_id == owner_id,
                Appointment.scheduled_at >= now,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
            .order_by(Appointment.scheduled_at)
        )
        return list(self.db.scalars(query).all())

    def create_appointment(
        self,
        pet_owner_id: UUID,
        vet_id: UUID,
        pet_id: UUID,
        scheduled_at: datetime,
        appointment_type: str,
        duration_minutes: int,
        notes: str | None = None,
    ) -> Appointment:
        """Create a new appointment"""
        appointment = Appointment(
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
            pet_id=pet_id,
            scheduled_at=scheduled_at,
            type=appointment_type,
            duration_minutes=duration_minutes,
            notes=notes,
            status=AppointmentStatus.PENDING,
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def get_vet_by_id(self, vet_id: UUID) -> Vet | None:
        """Get a vet by ID"""
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def get_all_vets(self, verified_only: bool = True) -> list[Vet]:
        """Get all vets, optionally filtering for verified ones only"""
        query = select(Vet).order_by(Vet.name)
        if verified_only:
            query = query.where(Vet.is_verified == True)
        return list(self.db.scalars(query).all())
