"""
Pet owner API endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_pet_owner
from app.db.base import PetOwner
from app.services.owner import OwnerService
from app.schemas.owner import (
    PetResponse,
    AppointmentCreateRequest,
    AppointmentResponse,
    VetListResponse,
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
