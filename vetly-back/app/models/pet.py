"""
Pet model
"""

import enum
from sqlalchemy import Column, String, Integer, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class PetType(str, enum.Enum):
    """Pet type enumeration"""
    DOG = "Dog"
    CAT = "Cat"
    OTHER = "Other"


class Gender(str, enum.Enum):
    """Gender enumeration"""
    MALE = "Male"
    FEMALE = "Female"


class Pet(BaseModel):
    """
    Pet model
    Represents pets owned by users
    """
    
    __tablename__ = "pets"
    
    # Foreign Keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Basic Information
    name = Column(String(100), nullable=False)
    type = Column(Enum(PetType), nullable=False)
    breed = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)  # in kg
    gender = Column(Enum(Gender), nullable=False)
    
    # Identification
    chip_number = Column(String(50), unique=True, nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="pets")
    medical_events = relationship(
        "MedicalEvent",
        back_populates="pet",
        cascade="all, delete-orphan",
        order_by="MedicalEvent.date.desc()"
    )
    weight_history = relationship(
        "WeightHistory",
        back_populates="pet",
        cascade="all, delete-orphan",
        order_by="WeightHistory.recorded_at.desc()"
    )
    appointments = relationship(
        "Appointment",
        back_populates="pet",
        cascade="all, delete-orphan"
    )
    medications = relationship(
        "Medication",
        back_populates="pet",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Pet(id={self.id}, name={self.name}, type={self.type.value})>"
