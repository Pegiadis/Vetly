"""
Pet service - business logic layer for vet patient management
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.pet import PetRepository
from app.schemas.pet import (
    PetListResponse,
    PetWithOwnerResponse,
    PetOwnerResponse,
    MedicalEventResponse,
    MedicalHistoryResponse,
)


class PetService:
    """Service for Pet business logic (vet context)"""

    def __init__(self, db: Session):
        self.repository = PetRepository(db)

    def list_patients(
        self,
        vet_id: UUID,
        search: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PetListResponse:
        """
        Get paginated list of vet's patients

        Args:
            vet_id: The vet's UUID
            search: Optional search term
            page: Page number
            page_size: Items per page

        Returns:
            Paginated list of pets
        """
        skip = (page - 1) * page_size
        pets, total = self.repository.get_vet_patients(
            vet_id=vet_id, search=search, skip=skip, limit=page_size
        )

        items = []
        for pet in pets:
            item = PetWithOwnerResponse.model_validate(pet)
            if pet.owner:
                item.owner = PetOwnerResponse.model_validate(pet.owner)
            items.append(item)

        return PetListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_patient(self, pet_id: UUID, vet_id: UUID) -> PetWithOwnerResponse:
        """
        Get a specific patient with owner details

        Args:
            pet_id: The pet's UUID
            vet_id: The vet's UUID (for verification)

        Returns:
            Pet with owner details

        Raises:
            HTTPException: If patient not found
        """
        pet = self.repository.get_patient_by_id(pet_id, vet_id)

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        response = PetWithOwnerResponse.model_validate(pet)
        if pet.owner:
            response.owner = PetOwnerResponse.model_validate(pet.owner)

        return response

    def get_patient_history(
        self,
        pet_id: UUID,
        vet_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> MedicalHistoryResponse:
        """
        Get patient medical history

        Args:
            pet_id: The pet's UUID
            vet_id: The vet's UUID (for verification)
            page: Page number
            page_size: Items per page

        Returns:
            Medical history response

        Raises:
            HTTPException: If patient not found
        """
        # First verify the patient exists and belongs to this vet
        pet = self.repository.get_patient_by_id(pet_id, vet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        skip = (page - 1) * page_size
        events, total = self.repository.get_patient_medical_history(
            pet_id=pet_id, skip=skip, limit=page_size
        )

        return MedicalHistoryResponse(
            items=[MedicalEventResponse.model_validate(event) for event in events],
            total=total,
        )
