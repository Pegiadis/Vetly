"""
Repository for vet client database operations
"""

from uuid import UUID, uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.db.base import VetClient, VetClientPet
from app.models.pet import PetType, Gender


class VetClientRepository:
    """Repository for vet client database operations"""

    def __init__(self, db: Session):
        self.db = db

    # --- Client CRUD ---

    def create(self, vet_id: UUID, name: str, email: str | None = None,
               phone: str | None = None, address: str | None = None,
               notes: str | None = None) -> VetClient:
        client = VetClient(
            id=uuid4(),
            vet_id=vet_id,
            name=name,
            email=email,
            phone=phone,
            address=address,
            notes=notes,
            status="managed",
        )
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client

    def get_by_vet(self, vet_id: UUID, search: str | None = None,
                   skip: int = 0, limit: int = 10) -> tuple[list[VetClient], int]:
        base_filter = VetClient.vet_id == vet_id
        filters = [base_filter]

        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    VetClient.name.ilike(term),
                    VetClient.email.ilike(term),
                    VetClient.phone.ilike(term),
                )
            )

        where = tuple(filters)
        query = (
            select(VetClient)
            .where(*where)
            .order_by(VetClient.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())

        count_query = select(func.count(VetClient.id)).where(*where)
        total = self.db.scalar(count_query) or 0

        return items, total

    def get_by_id_for_vet(self, client_id: UUID, vet_id: UUID) -> VetClient | None:
        query = (
            select(VetClient)
            .options(joinedload(VetClient.pets))
            .where(VetClient.id == client_id, VetClient.vet_id == vet_id)
        )
        return self.db.scalar(query)

    def get_by_email_for_vet(self, vet_id: UUID, email: str) -> VetClient | None:
        query = select(VetClient).where(
            VetClient.vet_id == vet_id,
            VetClient.email == email,
        )
        return self.db.scalar(query)

    def get_by_invite_token(self, token: str) -> VetClient | None:
        query = (
            select(VetClient)
            .options(joinedload(VetClient.vet))
            .where(VetClient.invite_token == token)
        )
        return self.db.scalar(query)

    def update(self, client: VetClient, **kwargs) -> VetClient:
        for key, value in kwargs.items():
            if hasattr(client, key):
                setattr(client, key, value)
        self.db.commit()
        self.db.refresh(client)
        return client

    def delete(self, client: VetClient) -> None:
        self.db.delete(client)
        self.db.commit()

    # --- Pet CRUD ---

    def add_pet(self, vet_client_id: UUID, name: str, pet_type: PetType,
                breed: str | None = None, age: int | None = None,
                weight: float | None = None, gender: Gender | None = None,
                notes: str | None = None) -> VetClientPet:
        pet = VetClientPet(
            id=uuid4(),
            vet_client_id=vet_client_id,
            name=name,
            type=pet_type,
            breed=breed,
            age=age,
            weight=weight,
            gender=gender,
            notes=notes,
        )
        self.db.add(pet)
        self.db.commit()
        self.db.refresh(pet)
        return pet

    def get_pet(self, pet_id: UUID, vet_client_id: UUID) -> VetClientPet | None:
        query = select(VetClientPet).where(
            VetClientPet.id == pet_id,
            VetClientPet.vet_client_id == vet_client_id,
        )
        return self.db.scalar(query)

    def update_pet(self, pet: VetClientPet, **kwargs) -> VetClientPet:
        for key, value in kwargs.items():
            if hasattr(pet, key):
                setattr(pet, key, value)
        self.db.commit()
        self.db.refresh(pet)
        return pet

    def delete_pet(self, pet: VetClientPet) -> None:
        self.db.delete(pet)
        self.db.commit()
