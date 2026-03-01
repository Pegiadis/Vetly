"""
Pet Owner model
"""

from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class PetOwner(BaseModel):
    """
    Pet Owner model
    Represents users who own pets and book appointments
    """

    __tablename__ = "pet_owners"

    # Basic Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)

    # Verification
    email_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    pets = relationship(
        "Pet",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    appointments = relationship(
        "Appointment",
        back_populates="pet_owner",
        cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review",
        back_populates="pet_owner",
        cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification",
        back_populates="pet_owner",
        cascade="all, delete-orphan",
        overlaps="vet"
    )
    vet_client_records = relationship(
        "VetClient",
        back_populates="pet_owner",
    )
    chat_conversations = relationship(
        "ChatConversation",
        back_populates="pet_owner",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<PetOwner(id={self.id}, email={self.email}, name={self.name})>"
