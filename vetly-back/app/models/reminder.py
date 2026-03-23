"""
Reminder model for automated vaccination and checkup reminders
"""

from sqlalchemy import Column, String, Text, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Reminder(BaseModel):
    """
    Reminder model
    Represents scheduled reminders for pet health events (vaccinations, checkups, etc.)
    """

    __tablename__ = "reminders"

    # Foreign Keys
    pet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pet_owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pet_owners.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Reminder Content
    type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)

    # Scheduling
    due_date = Column(Date, nullable=False)
    reminder_date = Column(Date, nullable=False)  # When to notify (e.g., 14 days before due_date)

    # Status
    is_sent = Column(Boolean, default=False, nullable=False, index=True)
    is_dismissed = Column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    pet = relationship("Pet")
    vet = relationship("Vet")
    pet_owner = relationship("PetOwner")

    def __repr__(self):
        return f"<Reminder(id={self.id}, type={self.type}, due_date={self.due_date}, is_sent={self.is_sent})>"
