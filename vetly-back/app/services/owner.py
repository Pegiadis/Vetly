"""
Service for pet owner related business logic
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.owner import OwnerRepository
from app.schemas.owner import (
    PetResponse,
    AppointmentCreateRequest,
    AppointmentResponse,
    VetListResponse,
)


class OwnerService:
    """Service for pet owner operations"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = OwnerRepository(db)

    def get_my_pets(self, owner_id: UUID) -> list[PetResponse]:
        """Get all pets for the logged-in owner"""
        pets = self.repository.get_pets_by_owner_id(owner_id)
        return [PetResponse.model_validate(pet) for pet in pets]

    def get_my_appointments(self, owner_id: UUID) -> list[AppointmentResponse]:
        """Get all appointments for the logged-in owner"""
        appointments = self.repository.get_appointments_by_owner_id(owner_id)
        return [AppointmentResponse.model_validate(apt) for apt in appointments]

    def get_upcoming_appointments(self, owner_id: UUID) -> list[AppointmentResponse]:
        """Get upcoming appointments for the logged-in owner"""
        appointments = self.repository.get_upcoming_appointments(owner_id)
        return [AppointmentResponse.model_validate(apt) for apt in appointments]

    def create_appointment(
        self, owner_id: UUID, data: AppointmentCreateRequest
    ) -> AppointmentResponse:
        """Create a new appointment"""
        # Verify the vet exists
        vet = self.repository.get_vet_by_id(data.vet_id)
        if not vet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vet not found",
            )

        # Verify the pet belongs to the owner
        pet = self.repository.get_pet_by_id(data.pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )

        # Create the appointment
        appointment = self.repository.create_appointment(
            pet_owner_id=owner_id,
            vet_id=data.vet_id,
            pet_id=data.pet_id,
            scheduled_at=data.scheduled_at,
            appointment_type=data.type,
            duration_minutes=data.duration_minutes,
            notes=data.notes,
        )

        return AppointmentResponse.model_validate(appointment)

    def get_vets(self, verified_only: bool = True) -> list[VetListResponse]:
        """Get list of available vets for booking"""
        vets = self.repository.get_all_vets(verified_only)
        return [VetListResponse.model_validate(vet) for vet in vets]
