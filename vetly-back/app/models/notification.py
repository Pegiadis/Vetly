"""
Notification model
"""

from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Notification(BaseModel):
    """
    Notification model
    Represents notifications sent to users and vets
    """
    
    __tablename__ = "notifications"
    
    # Foreign Keys (one of these should be set)
    pet_owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pet_owners.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Notification Content
    type = Column(String(50), nullable=False)  # e.g., "appointment", "medication", "system"
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Relationships
    pet_owner = relationship("PetOwner", back_populates="notifications")
    vet = relationship("Vet", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, is_read={self.is_read})>"
