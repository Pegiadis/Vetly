"""
Vet API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.services.vet import VetService
from app.schemas.vet import VetResponse, VetListResponse

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


@router.get("/{vet_id}", response_model=VetResponse)
def get_vet(
    vet_id: UUID,
    db: Session = Depends(get_db),
) -> VetResponse:
    """Get a single vet by ID"""
    service = VetService(db)
    return service.get_vet(vet_id)
