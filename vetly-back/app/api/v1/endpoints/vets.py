"""
Vet API endpoints
"""

from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.vet import VetService
from app.schemas.vet import (
    VetResponse,
    VetListResponse,
    VetUpdateRequest,
    VetHoursUpdateRequest,
    OnCallToggleRequest,
    OnCallVetsResponse,
    AvailableSlotsResponse,
)

router = APIRouter()


@router.get("", response_model=VetListResponse)
def list_vets(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> VetListResponse:
    """Get paginated list of all vets"""
    service = VetService(db)
    return service.list_vets(page=page, page_size=page_size)


@router.get("/search", response_model=VetListResponse)
def search_vets(
    q: str | None = Query(None, description="Search by name or specialty"),
    city: str | None = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> VetListResponse:
    """Search vets by name, specialty, or city"""
    service = VetService(db)
    return service.search_vets(query=q, city=city, page=page, page_size=page_size)


@router.get("/me", response_model=VetResponse)
def get_current_vet_profile(
    current_vet: Vet = Depends(get_current_vet),
) -> VetResponse:
    """Get the current authenticated vet's profile"""
    return VetResponse.model_validate(current_vet)


@router.put("/me", response_model=VetResponse)
def update_current_vet_profile(
    data: VetUpdateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetResponse:
    """Update the current authenticated vet's profile"""
    service = VetService(db)
    return service.update_profile(current_vet, data)


@router.put("/me/hours", response_model=VetResponse)
def update_current_vet_hours(
    data: VetHoursUpdateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetResponse:
    """Update the current authenticated vet's working hours"""
    service = VetService(db)
    return service.update_hours(current_vet, data)


@router.patch("/me/on-call", response_model=VetResponse)
def toggle_current_vet_on_call(
    data: OnCallToggleRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetResponse:
    """Toggle the current authenticated vet's on-call status"""
    service = VetService(db)
    return service.toggle_on_call(current_vet, data.is_on_call)


@router.get("/on-call", response_model=OnCallVetsResponse)
def get_on_call_vets(
    db: Session = Depends(get_db),
) -> OnCallVetsResponse:
    """Get all currently on-call vets"""
    service = VetService(db)
    return service.get_on_call_vets()


@router.get("/{vet_id}/available-slots", response_model=AvailableSlotsResponse)
def get_available_slots(
    vet_id: UUID,
    date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> AvailableSlotsResponse:
    """Get available time slots for a vet on a specific date"""
    service = VetService(db)
    return service.get_available_slots(vet_id, date)


@router.get("/{vet_id}", response_model=VetResponse)
def get_vet(
    vet_id: UUID,
    db: Session = Depends(get_db),
) -> VetResponse:
    """Get a single vet by ID"""
    service = VetService(db)
    return service.get_vet(vet_id)
