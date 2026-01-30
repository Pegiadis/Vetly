"""
Weight History model
"""

from sqlalchemy import Column, Float, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class WeightHistory(BaseModel):
    """
    Weight History model
    Tracks pet weight over time
    """
    
    __tablename__ = "weight_history"
    
    # Foreign Keys
    pet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Weight Information
    weight = Column(Float, nullable=False)  # in kg
    recorded_at = Column(Date, nullable=False, index=True)
    
    # Relationships
    pet = relationship("Pet", back_populates="weight_history")
    
    def __repr__(self):
        return f"<WeightHistory(id={self.id}, pet_id={self.pet_id}, weight={self.weight})>"
