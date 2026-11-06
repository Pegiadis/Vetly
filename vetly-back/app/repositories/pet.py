"""
Pet repository - data access layer for vet patient management
"""

from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.db.base import Pet, Appointment, PetOwner, MedicalEvent
from app.models.vet_client import VetClient, VetClientPet


class PetRepository:
    """Repository for Pet database operations (vet context)"""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def access_filter(vet_id: UUID):
        appointments = select(Appointment.pet_id).where(Appointment.vet_id == vet_id)
        managed = select(VetClientPet.pet_id).join(VetClient).where(VetClient.vet_id == vet_id)
        return or_(Pet.id.in_(appointments), Pet.id.in_(managed)) & Pet.deleted_at.is_(None)

    def get_vet_patients(
        self,
        vet_id: UUID,
        search: str | None = None,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Pet], int]:
        """
        Get clinical patients registered by this vet or seen in their appointments

        Args:
            vet_id: The vet's UUID
            search: Optional search term for pet name
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (list of pets, total count)
        """
        # Base query for pets
        base_filter = self.access_filter(vet_id)

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
        Get a specific patient by ID, ensuring they belong to this clinic or have an appointment with it

        Args:
            pet_id: The pet's UUID
            vet_id: The vet's UUID (for verification)

        Returns:
            Pet model or None if not found or not a patient of this vet
        """
        # Clinical writes using this identity must finish before an invitation can
        # transfer it. Otherwise a concurrent booking could retain the old owner.
        query = select(Pet).where(Pet.id == pet_id, self.access_filter(vet_id)).options(joinedload(Pet.owner)).with_for_update(of=Pet)
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
