"""
Review model
"""

from sqlalchemy import Column, Integer, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Review(BaseModel):
    """
    Review model
    Represents user reviews for veterinarians
    """
    
    __tablename__ = "reviews"
    
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
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Review Content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=False)
    reply = Column(Text, nullable=True)  # Vet's reply
    
    # Relationships
    vet = relationship("Vet", back_populates="reviews")
    pet_owner = relationship("PetOwner", back_populates="reviews")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range"),
        UniqueConstraint("vet_id", "pet_owner_id", name="uq_review_vet_owner"),
    )
    
    def __repr__(self):
        return f"<Review(id={self.id}, vet_id={self.vet_id}, rating={self.rating})>"
