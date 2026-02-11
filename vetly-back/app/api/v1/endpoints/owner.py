"""
Pet owner API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_pet_owner
from app.db.base import PetOwner
from app.services.owner import OwnerService
from app.schemas.owner import (
    PetResponse,
    AppointmentCreateRequest,
    AppointmentResponse,
    VetListResponse,
    OwnerMedicalHistoryResponse,
    MedicationResponse,
    OwnerReviewResponse,
    OwnerReviewCreateRequest,
    OwnerReviewUpdateRequest,
    NotificationResponse,
)

router = APIRouter()


@router.get("/pets", response_model=list[PetResponse])
def get_my_pets(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[PetResponse]:
    """Get all pets for the logged-in pet owner"""
    service = OwnerService(db)
    return service.get_my_pets(current_owner.id)


@router.get("/appointments", response_model=list[AppointmentResponse])
def get_my_appointments(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    """Get all appointments for the logged-in pet owner"""
    service = OwnerService(db)
    return service.get_my_appointments(current_owner.id)


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
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
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
    )


@router.get("/medications", response_model=list[MedicationResponse])
def get_my_medications(
    is_active: bool | None = Query(None, description="Filter by active status"),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[MedicationResponse]:
    """Get all medications for the owner's pets"""
    service = OwnerService(db)
    return service.get_my_medications(current_owner.id, is_active)


@router.get("/reviews", response_model=list[OwnerReviewResponse])
def get_my_reviews(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[OwnerReviewResponse]:
    """Get all reviews by the logged-in owner"""
    service = OwnerService(db)
    return service.get_my_reviews(current_owner.id)


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


@router.get("/notifications", response_model=list[NotificationResponse])
def get_my_notifications(
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    """Get all notifications for the logged-in owner"""
    service = OwnerService(db)
    return service.get_my_notifications(current_owner.id)


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
