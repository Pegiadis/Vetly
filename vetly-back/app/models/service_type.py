"""
ServiceType model - veterinary service catalog with pricing
"""

from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class ServiceType(BaseModel):
    """
    ServiceType model
    Represents a veterinary service offered by a vet with pricing information
    """

    __tablename__ = "service_types"

    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    vet = relationship("Vet", back_populates="service_types")

    def __repr__(self):
        return f"<ServiceType(id={self.id}, name={self.name}, price={self.price})>"
