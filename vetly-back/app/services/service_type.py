"""
ServiceType service - business logic layer
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.service_type import ServiceTypeRepository
from app.schemas.service_type import (
    ServiceTypeCreate,
    ServiceTypeListResponse,
    ServiceTypeResponse,
    ServiceTypeUpdate,
)


class ServiceTypeService:
    """Service for managing vet service types and pricing"""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ServiceTypeRepository(db)

    def create_service_type(
        self, vet_id: UUID, data: ServiceTypeCreate
    ) -> ServiceTypeResponse:
        """Create a new service type for a vet"""
        service_type = self.repo.create(
            vet_id=vet_id,
            name=data.name,
            description=data.description,
            price=data.price,
            duration_minutes=data.duration_minutes,
        )
        return ServiceTypeResponse.model_validate(service_type)

    def get_service_types(
        self, vet_id: UUID, page: int = 1, page_size: int = 20
    ) -> ServiceTypeListResponse:
        """Get paginated list of service types for a vet"""
        items, total = self.repo.get_by_vet_id(
            vet_id=vet_id, page=page, page_size=page_size
        )
        return ServiceTypeListResponse(
            items=[ServiceTypeResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def update_service_type(
        self, service_type_id: UUID, vet_id: UUID, data: ServiceTypeUpdate
    ) -> ServiceTypeResponse:
        """Update a service type owned by the vet"""
        service_type = self.repo.get_by_id(service_type_id)
        if not service_type or service_type.vet_id != vet_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service type not found",
            )

        update_fields = data.model_dump(exclude_unset=True)
        if update_fields:
            service_type = self.repo.update(service_type, **update_fields)

        return ServiceTypeResponse.model_validate(service_type)

    def delete_service_type(self, service_type_id: UUID, vet_id: UUID) -> None:
        """Soft-delete a service type by setting is_active=False"""
        service_type = self.repo.get_by_id(service_type_id)
        if not service_type or service_type.vet_id != vet_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service type not found",
            )
        self.repo.soft_delete(service_type)
