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
    OwnerMedicalEventResponse,
    OwnerMedicalHistoryResponse,
    MedicationResponse,
    OwnerReviewResponse,
    OwnerReviewCreateRequest,
    OwnerReviewUpdateRequest,
    NotificationResponse,
    OwnerProfileUpdateRequest,
    PetCreateRequest,
    PetUpdateRequest,
)
from app.schemas.owner import PetOwnerResponse


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

    def get_pet_medical_history(
        self, owner_id: UUID, pet_id: UUID, page: int = 1, page_size: int = 50
    ) -> OwnerMedicalHistoryResponse:
        """Get medical history for an owner's pet"""
        pet = self.repository.get_pet_by_id(pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )

        skip = (page - 1) * page_size
        events, total = self.repository.get_medical_history_for_pet(
            pet_id=pet_id, skip=skip, limit=page_size
        )

        return OwnerMedicalHistoryResponse(
            items=[OwnerMedicalEventResponse.model_validate(e) for e in events],
            total=total,
        )

    def get_my_medications(
        self, owner_id: UUID, is_active: bool | None = None
    ) -> list[MedicationResponse]:
        """Get all medications for an owner's pets"""
        medications = self.repository.get_medications_for_owner(owner_id, is_active)
        return [MedicationResponse.model_validate(m) for m in medications]

    # --- Reviews ---

    def get_my_reviews(self, owner_id: UUID) -> list[OwnerReviewResponse]:
        """Get all reviews by an owner"""
        reviews = self.repository.get_reviews_by_owner(owner_id)
        return [OwnerReviewResponse.model_validate(r) for r in reviews]

    def create_review(
        self, owner_id: UUID, data: OwnerReviewCreateRequest
    ) -> OwnerReviewResponse:
        """Create a new review"""
        vet = self.repository.get_vet_by_id(data.vet_id)
        if not vet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vet not found",
            )

        review = self.repository.create_review(
            pet_owner_id=owner_id,
            vet_id=data.vet_id,
            rating=data.rating,
            comment=data.comment,
            appointment_id=data.appointment_id,
        )
        # Re-fetch with vet relation loaded
        review = self.repository.get_review_by_id(review.id, owner_id)
        return OwnerReviewResponse.model_validate(review)

    def update_review(
        self, owner_id: UUID, review_id: UUID, data: OwnerReviewUpdateRequest
    ) -> OwnerReviewResponse:
        """Update an existing review"""
        review = self.repository.get_review_by_id(review_id, owner_id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        updated = self.repository.update_review(review, data.rating, data.comment)
        # Re-fetch with vet relation
        updated = self.repository.get_review_by_id(updated.id, owner_id)
        return OwnerReviewResponse.model_validate(updated)

    def delete_review(self, owner_id: UUID, review_id: UUID) -> None:
        """Delete a review"""
        review = self.repository.get_review_by_id(review_id, owner_id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )
        self.repository.delete_review(review)

    # --- Notifications ---

    def get_my_notifications(self, owner_id: UUID) -> list[NotificationResponse]:
        """Get all notifications for an owner"""
        notifications = self.repository.get_notifications_by_owner(owner_id)
        return [NotificationResponse.model_validate(n) for n in notifications]

    def mark_notification_read(self, owner_id: UUID, notification_id: UUID) -> NotificationResponse:
        """Mark a single notification as read"""
        notification = self.repository.get_notification_by_id(notification_id, owner_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )
        updated = self.repository.mark_notification_read(notification)
        return NotificationResponse.model_validate(updated)

    def mark_all_notifications_read(self, owner_id: UUID) -> int:
        """Mark all notifications as read, return count updated"""
        return self.repository.mark_all_notifications_read(owner_id)

    # --- Owner Profile ---

    def update_owner_profile(
        self, owner_id: UUID, data: OwnerProfileUpdateRequest
    ) -> PetOwnerResponse:
        """Update the owner's profile"""
        owner = self.repository.get_owner_by_id(owner_id)
        if not owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Owner not found",
            )
        updated = self.repository.update_owner(
            owner,
            name=data.name,
            phone=data.phone,
            address=data.address,
        )
        return PetOwnerResponse.model_validate(updated)

    # --- Pet CRUD ---

    def create_pet(self, owner_id: UUID, data: PetCreateRequest) -> PetResponse:
        """Create a new pet for the owner"""
        pet = self.repository.create_pet(
            pet_owner_id=owner_id,
            name=data.name,
            type=data.type,
            breed=data.breed,
            age=data.age,
            weight=data.weight,
            gender=data.gender,
            chip_number=data.chip_number,
        )
        return PetResponse.model_validate(pet)

    def update_pet(
        self, owner_id: UUID, pet_id: UUID, data: PetUpdateRequest
    ) -> PetResponse:
        """Update a pet belonging to the owner"""
        pet = self.repository.get_pet_by_id(pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )
        updated = self.repository.update_pet(
            pet,
            name=data.name,
            breed=data.breed,
            age=data.age,
            weight=data.weight,
            chip_number=data.chip_number,
        )
        return PetResponse.model_validate(updated)

    def delete_pet(self, owner_id: UUID, pet_id: UUID) -> None:
        """Delete a pet belonging to the owner"""
        pet = self.repository.get_pet_by_id(pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )
        self.repository.delete_pet(pet)
