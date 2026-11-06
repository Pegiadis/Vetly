"""
Repository for vet client database operations
"""

from uuid import UUID, uuid4

from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import Session, joinedload, subqueryload

from app.db.base import VetClient, VetClientPet
from app.models.appointment import Appointment
from app.models.pet_owner import PetOwner
from app.models.pet import Pet, PetType, Gender


class VetClientRepository:
    """Repository for vet client database operations"""

    def __init__(self, db: Session):
        self.db = db

    # --- Sync ---

    def sync_appointment_owners(self, vet_id: UUID) -> int:
        """Auto-create VetClient records for PetOwners with appointments."""
        # pet_owner_ids that already have a VetClient for this vet
        existing_links = (
            select(VetClient.pet_owner_id)
            .where(VetClient.vet_id == vet_id, VetClient.pet_owner_id.isnot(None))
            .subquery()
        )

        # PetOwners with appointments for this vet but no VetClient record
        missing_owners = list(self.db.scalars(
            select(PetOwner)
            .where(
                PetOwner.id.in_(
                    select(distinct(Appointment.pet_owner_id))
                    .where(Appointment.vet_id == vet_id)
                ),
                PetOwner.id.notin_(select(existing_links.c.pet_owner_id)),
            )
        ).all())

        created = 0
        for owner in missing_owners:
            # Check if there's an unlinked VetClient with matching email
            if owner.email:
                existing_by_email = self.db.scalar(
                    select(VetClient).where(
                        VetClient.vet_id == vet_id,
                        func.lower(VetClient.email) == owner.email.casefold(),
                    )
                )
                if existing_by_email:
                    # Matching contact details do not authorize claiming a clinic record.
                    # The owner must accept the invitation with a verified identity.
                    continue

            client = VetClient(
                id=uuid4(),
                vet_id=vet_id,
                pet_owner_id=owner.id,
                name=owner.name,
                email=owner.email,
                phone=owner.phone,
                address=owner.address,
                status="linked",
            )
            self.db.add(client)
            created += 1

        if missing_owners:
            self.db.commit()

        return created

    # --- Client CRUD ---

    def create(self, vet_id: UUID, name: str, email: str | None = None,
               phone: str | None = None, address: str | None = None,
               notes: str | None = None) -> VetClient:
        owner = PetOwner(name=name, phone=phone, address=address, email=None, password_hash=None)
        self.db.add(owner)
        self.db.flush()
        client = VetClient(
            id=uuid4(),
            vet_id=vet_id,
            name=name,
            email=email,
            phone=phone,
            address=address,
            notes=notes,
            status="managed",
            pet_owner_id=owner.id,
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
            .options(
                subqueryload(VetClient.pet_owner).subqueryload(PetOwner.pets),
            )
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
            .options(
                joinedload(VetClient.pets),
                joinedload(VetClient.pet_owner).subqueryload(PetOwner.pets),
            )
            .where(VetClient.id == client_id, VetClient.vet_id == vet_id)
        )
        return self.db.scalar(query)

    def get_by_email_for_vet(self, vet_id: UUID, email: str) -> VetClient | None:
        query = select(VetClient).where(
            VetClient.vet_id == vet_id,
            func.lower(VetClient.email) == email.casefold(),
        )
        return self.db.scalar(query)

    def get_by_invite_token(self, token: str) -> VetClient | None:
        query = (
            select(VetClient)
            .options(joinedload(VetClient.vet))
            .where(VetClient.invite_token == token)
            .with_for_update(of=VetClient)
        )
        return self.db.scalar(query)

    def update(self, client: VetClient, **kwargs) -> VetClient:
        if client.pet_owner and not client.pet_owner.email:
            for key in ('name', 'phone', 'address'):
                if key in kwargs:
                    setattr(client.pet_owner, key, kwargs[key])
        for key, value in kwargs.items():
            if hasattr(client, key):
                setattr(client, key, value)
        self.db.commit()
        self.db.refresh(client)
        return client

    def delete(self, client: VetClient) -> None:
        # Keep clinical identities/history; remove only the clinic's contact card.
        for pet in client.pets or []:
            self.db.delete(pet)
        self.db.delete(client)
        self.db.commit()

    # --- Pet CRUD ---

    def add_pet(self, vet_client_id: UUID, name: str, pet_type: PetType,
                breed: str | None = None, age: int | None = None,
                weight: float | None = None, gender: Gender | None = None,
                notes: str | None = None) -> VetClientPet:
        client = self.db.scalar(select(VetClient).where(VetClient.id == vet_client_id).with_for_update())
        identity = uuid4()
        clinical = Pet(id=identity, pet_owner_id=client.pet_owner_id, name=name,
                       type=pet_type, breed=breed, age=age, weight=weight, gender=gender)
        self.db.add(clinical)
        self.db.flush()
        pet = VetClientPet(
            id=identity,
            pet_id=identity,
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
                if key in ('name', 'type', 'breed', 'age', 'weight', 'gender'):
                    setattr(pet.clinical_pet, key, value)
        self.db.commit()
        self.db.refresh(pet)
        return pet

    def delete_pet(self, pet: VetClientPet) -> None:
        from datetime import datetime
        # Appointments, examinations and private notes must survive removal from lists.
        pet.clinical_pet.deleted_at = datetime.utcnow()
        self.db.commit()
