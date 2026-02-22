"""
Vet Client models - for vet-managed client records
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel
from app.models.pet import PetType, Gender


class VetClient(BaseModel):
    """
    Vet-managed client record.
    May or may not be linked to an existing PetOwner account.
    """

    __tablename__ = "vet_clients"
    __table_args__ = (
        UniqueConstraint("vet_id", "email", name="uq_vet_client_email"),
    )

    # Foreign Keys
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pet_owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pet_owners.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Client Info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    # Status: managed / invited / linked
    status = Column(String(20), nullable=False, default="managed")

    # Invite
    invite_token = Column(String(64), nullable=True, unique=True, index=True)
    invite_expires_at = Column(DateTime, nullable=True)

    # Relationships
    vet = relationship("Vet", back_populates="clients")
    pet_owner = relationship("PetOwner", back_populates="vet_client_records")
    pets = relationship(
        "VetClientPet",
        back_populates="client",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<VetClient(id={self.id}, name={self.name}, status={self.status})>"


class VetClientPet(BaseModel):
    """
    Pet record managed by a vet for their client.
    Separate from the main Pet model (which requires a PetOwner).
    """

    __tablename__ = "vet_client_pets"

    # Foreign Keys
    vet_client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vet_clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Pet Info
    name = Column(String(100), nullable=False)
    type = Column(Enum(PetType), nullable=False)
    breed = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    client = relationship("VetClient", back_populates="pets")

    def __repr__(self):
        return f"<VetClientPet(id={self.id}, name={self.name}, type={self.type})>"
