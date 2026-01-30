"""
Medical Event model
"""

from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class MedicalEvent(BaseModel):
    """
    Medical Event model
    Represents medical history events for pets
    """
    
    __tablename__ = "medical_events"
    
    # Foreign Keys
    pet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Event Information
    date = Column(Date, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    event_type = Column(String(100), nullable=False)  # e.g., "Vaccination", "Surgery", "Checkup"
    
    # Relationships
    pet = relationship("Pet", back_populates="medical_events")
    vet = relationship("Vet", back_populates="medical_events")
    
    def __repr__(self):
        return f"<MedicalEvent(id={self.id}, pet_id={self.pet_id}, type={self.event_type})>"
