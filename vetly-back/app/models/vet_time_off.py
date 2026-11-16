"""
Vet time off / closure model.
A closure blocks booking for whole days, or for a time window on each day, in an inclusive date range.
"""

from sqlalchemy import Column, Date, ForeignKey, String, Time
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import BaseModel


class VetTimeOff(BaseModel):
    __tablename__ = "vet_time_off"

    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    # Both null means the whole day; both set means that window on every day of the range.
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    reason = Column(String(255), nullable=True)

    def __repr__(self):
        return f"<VetTimeOff(vet_id={self.vet_id}, {self.start_date}..{self.end_date})>"
