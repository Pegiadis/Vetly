"""
Vet service - business logic layer
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.vet import VetRepository
from app.schemas.vet import VetResponse, VetListResponse


class VetService:
    """Service for Vet business logic"""

    def __init__(self, db: Session):
        self.repository = VetRepository(db)

    def list_vets(self, page: int = 1, page_size: int = 10) -> VetListResponse:
        """Get paginated list of vets"""
        skip = (page - 1) * page_size
        vets, total = self.repository.get_all(skip=skip, limit=page_size)

        return VetListResponse(
            items=[VetResponse.model_validate(vet) for vet in vets],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_vet(self, vet_id: UUID) -> VetResponse:
        """Get a single vet by ID"""
        vet = self.repository.get_by_id(vet_id)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vet not found",
            )

        return VetResponse.model_validate(vet)

    def search_vets(
        self, query: str | None = None, city: str | None = None, page: int = 1, page_size: int = 10
    ) -> VetListResponse:
        """Search vets by query or city"""
        skip = (page - 1) * page_size

        if city:
            vets, total = self.repository.get_by_city(city, skip=skip, limit=page_size)
        elif query:
            vets, total = self.repository.search(query, skip=skip, limit=page_size)
        else:
            vets, total = self.repository.get_all(skip=skip, limit=page_size)

        return VetListResponse(
            items=[VetResponse.model_validate(vet) for vet in vets],
            total=total,
            page=page,
            page_size=page_size,
        )
