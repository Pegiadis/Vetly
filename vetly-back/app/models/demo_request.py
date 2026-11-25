"""
Demo request model: a clinic asking for a demo from the public "Για κτηνιάτρους" page
"""

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import BaseModel

DEMO_STATUSES = ("new", "contacted", "converted", "closed")


class DemoRequest(BaseModel):
    """What the clinic sent and where the team is with it. Vets get accounts only through the admin panel."""

    __tablename__ = "demo_requests"

    name = Column(String(255), nullable=False)
    clinic_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    message = Column(Text, nullable=True)
    # new → contacted → converted (an account was created) or closed.
    status = Column(String(20), nullable=False, default="new", server_default="new", index=True)
    # The vet account created from this request, if any.
    vet_id = Column(UUID(as_uuid=True), ForeignKey("vets.id", ondelete="SET NULL"), nullable=True)

    def __repr__(self):
        return f"<DemoRequest(id={self.id}, email={self.email}, status={self.status})>"
