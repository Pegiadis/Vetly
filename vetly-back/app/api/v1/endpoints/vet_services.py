"""
Vet Service Management API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.service_type import ServiceTypeService
from app.schemas.service_type import (
    ServiceTypeCreate,
    ServiceTypeListResponse,
    ServiceTypeResponse,
    ServiceTypeUpdate,
)

router = APIRouter()


@router.get("", response_model=ServiceTypeListResponse)
def list_services(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ServiceTypeListResponse:
    """Get paginated list of the vet's service types"""
    service = ServiceTypeService(db)
    return service.get_service_types(
        vet_id=current_vet.id,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ServiceTypeResponse, status_code=201)
def create_service(
    data: ServiceTypeCreate,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ServiceTypeResponse:
    """Create a new service type for the vet"""
    service = ServiceTypeService(db)
    return service.create_service_type(vet_id=current_vet.id, data=data)


@router.put("/{service_id}", response_model=ServiceTypeResponse)
def update_service(
    service_id: UUID,
    data: ServiceTypeUpdate,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ServiceTypeResponse:
    """Update an existing service type"""
    service = ServiceTypeService(db)
    return service.update_service_type(
        service_type_id=service_id,
        vet_id=current_vet.id,
        data=data,
    )


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> None:
    """Soft-delete a service type (sets is_active=False)"""
    service = ServiceTypeService(db)
    service.delete_service_type(
        service_type_id=service_id,
        vet_id=current_vet.id,
    )
