"""
Pet repository - data access layer for vet patient management
"""

from uuid import UUID
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session, joinedload

from app.db.base import Pet, Appointment, PetOwner, MedicalEvent


class PetRepository:
    """Repository for Pet database operations (vet context)"""

    def __init__(self, db: Session):
        self.db = db

    def get_vet_patients(
        self,
        vet_id: UUID,
        search: str | None = None,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Pet], int]:
        """
        Get pets that have had appointments with this vet

        Args:
            vet_id: The vet's UUID
            search: Optional search term for pet name
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (list of pets, total count)
        """
        # Subquery to get pet IDs that have appointments with this vet
        pet_ids_subquery = (
            select(distinct(Appointment.pet_id))
            .where(Appointment.vet_id == vet_id)
            .subquery()
        )

        # Base query for pets
        base_filter = Pet.id.in_(select(pet_ids_subquery))

        if search:
            base_filter = base_filter & Pet.name.ilike(f"%{search}%")

        query = (
            select(Pet)
            .where(base_filter)
            .options(joinedload(Pet.owner))
            .offset(skip)
            .limit(limit)
            .order_by(Pet.name)
        )
        pets = self.db.scalars(query).unique().all()

        # Count total
        count_query = select(func.count(Pet.id)).where(base_filter)
        total = self.db.scalar(count_query) or 0

        return list(pets), total

    def get_patient_by_id(self, pet_id: UUID, vet_id: UUID) -> Pet | None:
        """
        Get a specific patient by ID, ensuring they have an appointment with this vet

        Args:
            pet_id: The pet's UUID
            vet_id: The vet's UUID (for verification)

        Returns:
            Pet model or None if not found or not a patient of this vet
        """
        # Verify pet has had an appointment with this vet
        appointment_exists = self.db.scalar(
            select(Appointment.id)
            .where(Appointment.pet_id == pet_id, Appointment.vet_id == vet_id)
            .limit(1)
        )

        if not appointment_exists:
            return None

        query = select(Pet).where(Pet.id == pet_id).options(joinedload(Pet.owner))
        return self.db.scalar(query)

    def get_patient_medical_history(
        self, pet_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[list[MedicalEvent], int]:
        """
        Get medical history for a patient

        Args:
            pet_id: The pet's UUID
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (list of medical events, total count)
        """
        query = (
            select(MedicalEvent)
            .where(MedicalEvent.pet_id == pet_id)
            .order_by(MedicalEvent.date.desc())
            .offset(skip)
            .limit(limit)
        )
        events = self.db.scalars(query).all()

        count_query = select(func.count(MedicalEvent.id)).where(
            MedicalEvent.pet_id == pet_id
        )
        total = self.db.scalar(count_query) or 0

        return list(events), total
