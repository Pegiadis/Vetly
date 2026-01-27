"""
Review model
"""

from sqlalchemy import Column, Integer, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


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
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
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
    user = relationship("User", back_populates="reviews")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range"),
    )
    
    def __repr__(self):
        return f"<Review(id={self.id}, vet_id={self.vet_id}, rating={self.rating})>"
