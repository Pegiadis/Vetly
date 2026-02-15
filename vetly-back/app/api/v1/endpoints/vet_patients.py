"""
Vet Patient Management API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.pet import PetService
from app.schemas.pet import (
    PetListResponse,
    PetWithOwnerResponse,
    MedicalHistoryResponse,
)

router = APIRouter()


@router.get("", response_model=PetListResponse)
def list_patients(
    search: str | None = Query(None, description="Search by pet name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> PetListResponse:
    """Get paginated list of vet's patients"""
    service = PetService(db)
    return service.list_patients(
        vet_id=current_vet.id,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/{pet_id}", response_model=PetWithOwnerResponse)
def get_patient(
    pet_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> PetWithOwnerResponse:
    """Get a specific patient with owner details"""
    service = PetService(db)
    return service.get_patient(pet_id=pet_id, vet_id=current_vet.id)


@router.get("/{pet_id}/history", response_model=MedicalHistoryResponse)
def get_patient_history(
    pet_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> MedicalHistoryResponse:
    """Get patient medical history"""
    service = PetService(db)
    return service.get_patient_history(
        pet_id=pet_id,
        vet_id=current_vet.id,
        page=page,
        page_size=page_size,
    )
