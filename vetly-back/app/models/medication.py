"""
Medication model
"""

import enum
from sqlalchemy import Column, String, Date, Time, Text, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class MedicationFrequency(str, enum.Enum):
    """Medication frequency enumeration"""
    DAILY = "daily"
    WEEKLY = "weekly"
    ONCE = "once"


class Medication(BaseModel):
    """
    Medication model
    Tracks pet medications and reminders
    """
    
    __tablename__ = "medications"
    
    # Foreign Keys
    pet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Medication Information
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)  # e.g., "10mg", "2 tablets"
    frequency = Column(Enum(MedicationFrequency), nullable=False)
    time = Column(Time, nullable=False)  # Time of day to take
    
    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # Null for ongoing medications
    
    # Additional Information
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    pet = relationship("Pet", back_populates="medications")
    
    def __repr__(self):
        return f"<Medication(id={self.id}, pet_id={self.pet_id}, name={self.name})>"
