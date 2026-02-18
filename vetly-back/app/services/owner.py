"""
Service for pet owner related business logic
"""

from uuid import UUID
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.owner import OwnerRepository
from app.services.notification import NotificationService
from app.models.appointment import AppointmentStatus
from app.schemas.owner import (
    PetResponse,
    PetPaginatedResponse,
    AppointmentCreateRequest,
    AppointmentRescheduleRequest,
    AppointmentResponse,
    AppointmentPaginatedResponse,
    VetListResponse,
    OwnerMedicalEventResponse,
    OwnerMedicalHistoryResponse,
    MedicationResponse,
    MedicationPaginatedResponse,
    OwnerReviewResponse,
    OwnerReviewPaginatedResponse,
    OwnerReviewCreateRequest,
    OwnerReviewUpdateRequest,
    NotificationResponse,
    NotificationPaginatedResponse,
    OwnerProfileUpdateRequest,
    PetCreateRequest,
    PetUpdateRequest,
    PetOwnerResponse,
)


class OwnerService:
    """Service for pet owner operations"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = OwnerRepository(db)
        self.notifications = NotificationService(db)

    def get_my_pets(self, owner_id: UUID, page: int = 1, page_size: int = 6) -> PetPaginatedResponse:
        """Get pets for the logged-in owner with pagination"""
        skip = (page - 1) * page_size
        pets, total = self.repository.get_pets_by_owner_id(owner_id, skip=skip, limit=page_size)
        return PetPaginatedResponse(
            items=[PetResponse.model_validate(pet) for pet in pets],
            total=total, page=page, page_size=page_size,
        )

    def get_my_appointments(
        self, owner_id: UUID, page: int = 1, page_size: int = 10,
        status_filter: str | None = None, date_from: date | None = None,
        date_to: date | None = None, pet_name: str | None = None,
    ) -> AppointmentPaginatedResponse:
        """Get appointments for the logged-in owner with pagination and filters"""
        skip = (page - 1) * page_size
        appointments, total = self.repository.get_appointments_by_owner_id(
            owner_id, skip=skip, limit=page_size,
            status=status_filter, date_from=date_from, date_to=date_to, pet_name=pet_name,
        )
        return AppointmentPaginatedResponse(
            items=[AppointmentResponse.model_validate(apt) for apt in appointments],
            total=total, page=page, page_size=page_size,
        )

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

        # Check for conflicting appointments
        if self.repository.has_conflicting_appointment(
            data.vet_id, data.scheduled_at, data.duration_minutes
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Η ώρα αυτή μόλις κρατήθηκε από κάποιον άλλο. Παρακαλώ επιλέξτε άλλη ώρα.",
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

        # Notify vet
        owner = self.repository.get_owner_by_id(owner_id)
        owner_name = owner.name if owner else ""
        date_str = data.scheduled_at.strftime("%d/%m/%Y %H:%M")
        self.notifications.notify_vet(
            data.vet_id,
            type="appointment",
            title="Νέο αίτημα ραντεβού",
            message=f"{owner_name} ζήτησε ραντεβού για {pet.name} στις {date_str}",
        )

        return AppointmentResponse.model_validate(appointment)

    def cancel_appointment(self, owner_id: UUID, appointment_id: UUID) -> AppointmentResponse:
        """Cancel an appointment owned by the owner"""
        appointment = self.repository.get_appointment_by_id(appointment_id, owner_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        if appointment.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μόνο ενεργά ραντεβού μπορούν να ακυρωθούν.",
            )

        cancelled = self.repository.cancel_appointment(appointment)

        owner = self.repository.get_owner_by_id(owner_id)
        owner_name = owner.name if owner else ""
        pet_name = appointment.pet.name if appointment.pet else ""
        date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
        self.notifications.notify_vet(
            appointment.vet_id,
            type="appointment",
            title="Ακύρωση ραντεβού",
            message=f"Ο ιδιοκτήτης {owner_name} ακύρωσε το ραντεβού για {pet_name} στις {date_str}",
        )

        return AppointmentResponse.model_validate(cancelled)

    def reschedule_appointment(
        self, owner_id: UUID, appointment_id: UUID, data: AppointmentRescheduleRequest
    ) -> AppointmentResponse:
        """Reschedule an appointment to a new date/time"""
        appointment = self.repository.get_appointment_by_id(appointment_id, owner_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        if appointment.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μόνο ενεργά ραντεβού μπορούν να αναπρογραμματιστούν.",
            )

        rescheduled = self.repository.reschedule_appointment(appointment, data.scheduled_at)

        owner = self.repository.get_owner_by_id(owner_id)
        owner_name = owner.name if owner else ""
        pet_name = appointment.pet.name if appointment.pet else ""
        new_date_str = data.scheduled_at.strftime("%d/%m/%Y %H:%M")
        self.notifications.notify_vet(
            appointment.vet_id,
            type="appointment",
            title="Αναπρογραμματισμός ραντεβού",
            message=f"Ο ιδιοκτήτης {owner_name} αναπρογραμμάτισε το ραντεβού για {pet_name} στις {new_date_str}",
        )

        return AppointmentResponse.model_validate(rescheduled)

    def get_vets(self, verified_only: bool = True) -> list[VetListResponse]:
        """Get list of available vets for booking"""
        vets = self.repository.get_all_vets(verified_only)
        return [VetListResponse.model_validate(vet) for vet in vets]

    def get_pet_medical_history(
        self, owner_id: UUID, pet_id: UUID, page: int = 1, page_size: int = 10,
        event_type: str | None = None,
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
            pet_id=pet_id, skip=skip, limit=page_size, event_type=event_type,
        )

        return OwnerMedicalHistoryResponse(
            items=[OwnerMedicalEventResponse.model_validate(e) for e in events],
            total=total, page=page, page_size=page_size,
        )

    def get_my_medications(
        self, owner_id: UUID, is_active: bool | None = None, page: int = 1, page_size: int = 10,
    ) -> MedicationPaginatedResponse:
        """Get medications for an owner's pets with pagination"""
        skip = (page - 1) * page_size
        medications, total = self.repository.get_medications_for_owner(
            owner_id, is_active, skip=skip, limit=page_size,
        )
        return MedicationPaginatedResponse(
            items=[MedicationResponse.model_validate(m) for m in medications],
            total=total, page=page, page_size=page_size,
        )

    def delete_medication(self, owner_id: UUID, medication_id: UUID) -> None:
        """Delete a medication belonging to the owner's pet"""
        medication = self.repository.get_medication_by_id(medication_id, owner_id)
        if not medication:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medication not found",
            )
        self.repository.delete_medication(medication)

    # --- Reviews ---

    def get_my_reviews(self, owner_id: UUID, page: int = 1, page_size: int = 10) -> OwnerReviewPaginatedResponse:
        """Get reviews by an owner with pagination"""
        skip = (page - 1) * page_size
        reviews, total = self.repository.get_reviews_by_owner(owner_id, skip=skip, limit=page_size)
        return OwnerReviewPaginatedResponse(
            items=[OwnerReviewResponse.model_validate(r) for r in reviews],
            total=total, page=page, page_size=page_size,
        )

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
        self.repository.update_vet_rating(data.vet_id)

        # Notify vet
        self.notifications.notify_vet(
            data.vet_id,
            type="review",
            title="Νέα αξιολόγηση",
            message=f"Λάβατε αξιολόγηση {data.rating} αστεριών",
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

        vet_id = review.vet_id
        updated = self.repository.update_review(review, data.rating, data.comment)
        if data.rating is not None:
            self.repository.update_vet_rating(vet_id)
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
        vet_id = review.vet_id
        self.repository.delete_review(review)
        self.repository.update_vet_rating(vet_id)

    # --- Notifications ---

    def get_my_notifications(self, owner_id: UUID, page: int = 1, page_size: int = 10) -> NotificationPaginatedResponse:
        """Get notifications for an owner with pagination"""
        skip = (page - 1) * page_size
        notifications, total = self.repository.get_notifications_by_owner(owner_id, skip=skip, limit=page_size)
        return NotificationPaginatedResponse(
            items=[NotificationResponse.model_validate(n) for n in notifications],
            total=total, page=page, page_size=page_size,
        )

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
        if data.chip_number:
            existing = self.repository.get_pet_by_chip_number(data.chip_number)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ο αριθμός microchip χρησιμοποιείται ήδη από άλλο κατοικίδιο.",
                )
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
        if data.chip_number:
            existing = self.repository.get_pet_by_chip_number(data.chip_number, exclude_pet_id=pet_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ο αριθμός microchip χρησιμοποιείται ήδη από άλλο κατοικίδιο.",
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
        """
        Soft-delete a pet belonging to the owner.
        The pet and its child records are retained for 30 days.
        Cleanup: DELETE FROM pets WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
        """
        pet = self.repository.get_pet_by_id(pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )
        self.repository.delete_pet(pet)

    def get_deleted_pets(self, owner_id: UUID) -> list[PetResponse]:
        """Get all soft-deleted pets for the owner"""
        pets = self.repository.get_deleted_pets_by_owner_id(owner_id)
        return [PetResponse.model_validate(p) for p in pets]

    def restore_pet(self, owner_id: UUID, pet_id: UUID) -> PetResponse:
        """Restore a soft-deleted pet"""
        pet = self.repository.get_deleted_pet_by_id(pet_id, owner_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you",
            )
        restored = self.repository.restore_pet(pet)
        return PetResponse.model_validate(restored)
