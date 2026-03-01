"""
Pet owner API endpoints
"""

from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_pet_owner
from app.db.base import PetOwner
from app.services.owner import OwnerService
from app.schemas.owner import (
    PetPaginatedResponse,
    PetOwnerResponse,
    AppointmentCreateRequest,
    AppointmentRescheduleRequest,
    AppointmentResponse,
    AppointmentPaginatedResponse,
    VetListResponse,
    OwnerMedicalHistoryResponse,
    MedicationPaginatedResponse,
    OwnerReviewResponse,
    OwnerReviewPaginatedResponse,
    OwnerReviewCreateRequest,
    OwnerReviewUpdateRequest,
    NotificationPaginatedResponse,
    NotificationResponse,
    UnreadCountResponse,
    OwnerProfileUpdateRequest,
    PetCreateRequest,
    PetUpdateRequest,
    PetResponse,
)
from app.repositories.notification import NotificationRepository

router = APIRouter()


@router.get("/pets", response_model=PetPaginatedResponse)
def get_my_pets(
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> PetPaginatedResponse:
    """Get pets for the logged-in pet owner with pagination"""
    service = OwnerService(db)
    return service.get_my_pets(current_owner.id, page=page, page_size=page_size)


@router.get("/appointments", response_model=AppointmentPaginatedResponse)
def get_my_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: str | None = Query(None, description="Filter: upcoming or past"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    pet_name: str | None = Query(None),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> AppointmentPaginatedResponse:
    """Get appointments for the logged-in pet owner with pagination and filters"""
    service = OwnerService(db)
    return service.get_my_appointments(
        current_owner.id, page=page, page_size=page_size,
        status_filter=status, date_from=date_from, date_to=date_to, pet_name=pet_name,
    )


@router.get("/appointments/upcoming", response_model=list[AppointmentResponse])
def get_upcoming_appointments(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    """Get upcoming appointments for the logged-in pet owner"""
    service = OwnerService(db)
    return service.get_upcoming_appointments(current_owner.id)


@router.post("/appointments", response_model=AppointmentResponse, status_code=201)
def create_appointment(
    data: AppointmentCreateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Create a new appointment for a pet"""
    service = OwnerService(db)
    return service.create_appointment(current_owner.id, data)


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Cancel an appointment"""
    service = OwnerService(db)
    return service.cancel_appointment(current_owner.id, appointment_id)


@router.patch("/appointments/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: UUID,
    data: AppointmentRescheduleRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Reschedule an appointment to a new date/time"""
    service = OwnerService(db)
    return service.reschedule_appointment(current_owner.id, appointment_id, data)


@router.get("/vets", response_model=list[VetListResponse])
def get_available_vets(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[VetListResponse]:
    """Get list of available vets for booking"""
    service = OwnerService(db)
    return service.get_vets()


@router.get("/pets/{pet_id}/medical-history", response_model=OwnerMedicalHistoryResponse)
def get_pet_medical_history(
    pet_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    event_type: str | None = Query(None),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> OwnerMedicalHistoryResponse:
    """Get medical history for a specific pet"""
    service = OwnerService(db)
    return service.get_pet_medical_history(
        owner_id=current_owner.id,
        pet_id=pet_id,
        page=page,
        page_size=page_size,
        event_type=event_type,
    )


@router.get("/medications", response_model=MedicationPaginatedResponse)
def get_my_medications(
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> MedicationPaginatedResponse:
    """Get medications for the owner's pets with pagination"""
    service = OwnerService(db)
    return service.get_my_medications(current_owner.id, is_active, page=page, page_size=page_size)


@router.delete("/medications/{medication_id}", status_code=204)
def delete_medication(
    medication_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> None:
    """Delete a medication"""
    service = OwnerService(db)
    service.delete_medication(current_owner.id, medication_id)


@router.get("/reviewable-vets", response_model=list[VetListResponse])
def get_reviewable_vets(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[VetListResponse]:
    """Get vets with whom the owner has completed appointments (for review creation)"""
    service = OwnerService(db)
    return service.get_reviewable_vets(current_owner.id)


@router.get("/reviews", response_model=OwnerReviewPaginatedResponse)
def get_my_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> OwnerReviewPaginatedResponse:
    """Get reviews by the logged-in owner with pagination"""
    service = OwnerService(db)
    return service.get_my_reviews(current_owner.id, page=page, page_size=page_size)


@router.post("/reviews", response_model=OwnerReviewResponse, status_code=201)
def create_review(
    data: OwnerReviewCreateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> OwnerReviewResponse:
    """Create a new review for a vet"""
    service = OwnerService(db)
    return service.create_review(current_owner.id, data)


@router.put("/reviews/{review_id}", response_model=OwnerReviewResponse)
def update_review(
    review_id: UUID,
    data: OwnerReviewUpdateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> OwnerReviewResponse:
    """Update an existing review"""
    service = OwnerService(db)
    return service.update_review(current_owner.id, review_id, data)


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> None:
    """Delete a review"""
    service = OwnerService(db)
    service.delete_review(current_owner.id, review_id)


@router.get("/notifications", response_model=NotificationPaginatedResponse)
def get_my_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> NotificationPaginatedResponse:
    """Get notifications for the logged-in owner with pagination"""
    service = OwnerService(db)
    return service.get_my_notifications(current_owner.id, page=page, page_size=page_size)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """Mark a single notification as read"""
    service = OwnerService(db)
    return service.mark_notification_read(current_owner.id, notification_id)


@router.post("/notifications/mark-all-read", status_code=204)
def mark_all_notifications_read(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> None:
    """Mark all notifications as read"""
    service = OwnerService(db)
    service.mark_all_notifications_read(current_owner.id)


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    """Get unread notification count for polling"""
    repo = NotificationRepository(db)
    count = repo.count_unread_for_owner(current_owner.id)
    return UnreadCountResponse(count=count)


@router.get("/notifications/latest-unread", response_model=NotificationResponse | None)
def get_latest_unread(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> NotificationResponse | None:
    """Get the latest unread notification for popup display"""
    repo = NotificationRepository(db)
    notification = repo.get_latest_unread_for_owner(current_owner.id)
    if not notification:
        return None
    return NotificationResponse.model_validate(notification)


@router.put("/profile", response_model=PetOwnerResponse)
def update_owner_profile(
    data: OwnerProfileUpdateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> PetOwnerResponse:
    """Update the owner's profile"""
    service = OwnerService(db)
    return service.update_owner_profile(current_owner.id, data)


@router.post("/pets", response_model=PetResponse, status_code=201)
def create_pet(
    data: PetCreateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> PetResponse:
    """Create a new pet"""
    service = OwnerService(db)
    return service.create_pet(current_owner.id, data)


@router.put("/pets/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: UUID,
    data: PetUpdateRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> PetResponse:
    """Update a pet"""
    service = OwnerService(db)
    return service.update_pet(current_owner.id, pet_id, data)


@router.delete("/pets/{pet_id}", status_code=204)
def delete_pet(
    pet_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> None:
    """Delete a pet"""
    service = OwnerService(db)
    service.delete_pet(current_owner.id, pet_id)


@router.get("/pets/deleted", response_model=list[PetResponse])
def get_deleted_pets(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[PetResponse]:
    """Get all soft-deleted pets"""
    service = OwnerService(db)
    return service.get_deleted_pets(current_owner.id)


@router.post("/pets/{pet_id}/restore", response_model=PetResponse)
def restore_pet(
    pet_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> PetResponse:
    """Restore a soft-deleted pet"""
    service = OwnerService(db)
    return service.restore_pet(current_owner.id, pet_id)
