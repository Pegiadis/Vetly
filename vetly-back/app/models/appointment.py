"""
Appointment model
"""

import enum
from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(BaseModel):
    """
    Appointment model
    Represents booking appointments between users and vets
    """
    
    __tablename__ = "appointments"
    
    # Foreign Keys
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    pet_owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pet_owners.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    pet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Appointment Details
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    type = Column(String(100), nullable=False)  # e.g., "Checkup", "Vaccination", "Emergency"
    status = Column(
        Enum(AppointmentStatus),
        default=AppointmentStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Pricing
    service_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_types.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    price = Column(Numeric(10, 2), nullable=True)

    # Additional Information
    notes = Column(Text, nullable=True)

    # Grouping (multi-pet bookings share the same group_id)
    group_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Relationships
    vet = relationship("Vet", back_populates="appointments")
    pet_owner = relationship("PetOwner", back_populates="appointments")
    pet = relationship("Pet", back_populates="appointments")
    service_type = relationship("ServiceType")
    
    def __repr__(self):
        return f"<Appointment(id={self.id}, scheduled_at={self.scheduled_at}, status={self.status.value})>"
