"""
Vet (Veterinarian) model
"""

from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Vet(BaseModel):
    """
    Veterinarian model
    Represents veterinary professionals who provide services
    """
    
    __tablename__ = "vets"
    
    # Basic Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for existing records
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=True)
    specialty = Column(String(255), nullable=False)  # e.g., "General Practice", "Surgery"
    license_number = Column(String(100), unique=True, nullable=False, index=True)
    
    # Contact Information
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False, index=True)
    
    # Location (for map search)
    coordinates_lat = Column(Numeric(10, 8), nullable=True)
    coordinates_lng = Column(Numeric(11, 8), nullable=True)
    
    # Working Hours (stored as JSON)
    # Format: {"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}
    hours = Column(JSONB, nullable=True)
    
    # Profile
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # Status
    is_on_call = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Ratings
    rating_average = Column(Numeric(3, 2), default=0.0, nullable=False)
    reviews_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    appointments = relationship(
        "Appointment",
        back_populates="vet",
        cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review",
        back_populates="vet",
        cascade="all, delete-orphan"
    )
    medical_events = relationship(
        "MedicalEvent",
        back_populates="vet"
    )
    notifications = relationship(
        "Notification",
        back_populates="vet",
        overlaps="pet_owner"
    )
    blog_posts = relationship(
        "BlogPost",
        back_populates="author_vet"
    )
    clients = relationship(
        "VetClient",
        back_populates="vet",
        cascade="all, delete-orphan"
    )
    chat_conversations = relationship(
        "ChatConversation",
        back_populates="vet",
        cascade="all, delete-orphan",
    )
    service_types = relationship(
        "ServiceType",
        back_populates="vet",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Vet(id={self.id}, name={self.name}, specialty={self.specialty})>"
