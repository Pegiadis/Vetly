"""
ServiceType repository - data access layer
"""

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.service_type import ServiceType


class ServiceTypeRepository:
    """Repository for ServiceType database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, service_type_id: UUID) -> ServiceType | None:
        """Get a service type by ID"""
        return self.db.get(ServiceType, service_type_id)

    def get_by_vet_id(
        self,
        vet_id: UUID,
        page: int = 1,
        page_size: int = 20,
        include_inactive: bool = False,
    ) -> tuple[list[ServiceType], int]:
        """
        Get service types for a vet with pagination

        Args:
            vet_id: The vet's UUID
            page: Page number (1-based)
            page_size: Items per page
            include_inactive: Whether to include inactive services

        Returns:
            Tuple of (list of service types, total count)
        """
        filters = [ServiceType.vet_id == vet_id]
        if not include_inactive:
            filters.append(ServiceType.is_active == True)

        skip = (page - 1) * page_size

        query = (
            select(ServiceType)
            .where(*filters)
            .order_by(ServiceType.name)
            .offset(skip)
            .limit(page_size)
        )
        items = list(self.db.scalars(query).all())

        count_query = select(func.count(ServiceType.id)).where(*filters)
        total = self.db.scalar(count_query) or 0

        return items, total

    def create(
        self,
        vet_id: UUID,
        name: str,
        price: object,
        description: str | None = None,
        duration_minutes: int = 30,
    ) -> ServiceType:
        """Create a new service type"""
        service_type = ServiceType(
            vet_id=vet_id,
            name=name,
            description=description,
            price=price,
            duration_minutes=duration_minutes,
            is_active=True,
        )
        self.db.add(service_type)
        self.db.commit()
        self.db.refresh(service_type)
        return service_type

    def update(self, service_type: ServiceType, **kwargs) -> ServiceType:
        """Update a service type with given fields"""
        for field, value in kwargs.items():
            if value is not None or field == "description":
                setattr(service_type, field, value)
        self.db.commit()
        self.db.refresh(service_type)
        return service_type

    def soft_delete(self, service_type: ServiceType) -> ServiceType:
        """Soft delete a service type by setting is_active=False"""
        service_type.is_active = False
        self.db.commit()
        self.db.refresh(service_type)
        return service_type
