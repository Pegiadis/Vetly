"""
Vet repository - data access layer
"""

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.base import Vet


class VetRepository:
    """Repository for Vet database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Vet | None:
        """Get a vet by email"""
        query = select(Vet).where(Vet.email == email)
        return self.db.scalar(query)

    def get_all(self, skip: int = 0, limit: int = 10) -> tuple[list[Vet], int]:
        """Get all vets with pagination"""
        query = select(Vet).offset(skip).limit(limit)
        vets = self.db.scalars(query).all()

        total = self.db.scalar(select(func.count(Vet.id)))

        return list(vets), total or 0

    def get_by_id(self, vet_id: UUID) -> Vet | None:
        """Get a single vet by ID"""
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def get_by_city(self, city: str, skip: int = 0, limit: int = 10) -> tuple[list[Vet], int]:
        """Get vets filtered by city"""
        query = select(Vet).where(Vet.city.ilike(f"%{city}%")).offset(skip).limit(limit)
        vets = self.db.scalars(query).all()

        total = self.db.scalar(
            select(func.count(Vet.id)).where(Vet.city.ilike(f"%{city}%"))
        )

        return list(vets), total or 0

    def search(self, query_str: str, skip: int = 0, limit: int = 10) -> tuple[list[Vet], int]:
        """Search vets by name or specialty"""
        search_filter = (Vet.name.ilike(f"%{query_str}%")) | (
            Vet.specialty.ilike(f"%{query_str}%")
        )

        query = select(Vet).where(search_filter).offset(skip).limit(limit)
        vets = self.db.scalars(query).all()

        total = self.db.scalar(select(func.count(Vet.id)).where(search_filter))

        return list(vets), total or 0
