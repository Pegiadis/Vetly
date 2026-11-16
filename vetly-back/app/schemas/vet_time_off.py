"""
Schemas for vet time off / closures
"""

from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TimeOffCreate(BaseModel):
    start_date: date
    end_date: date
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = Field(None, max_length=255)

    @model_validator(mode="after")
    def _check(self):
        if self.end_date < self.start_date:
            raise ValueError("Η ημερομηνία λήξης δεν μπορεί να είναι πριν την έναρξη.")
        if (self.start_time is None) != (self.end_time is None):
            raise ValueError("Ορίστε και ώρα έναρξης και ώρα λήξης, ή καμία από τις δύο.")
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.")
        if self.reason is not None:
            self.reason = self.reason.strip() or None
        return self


class TimeOffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    start_date: date
    end_date: date
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = None
    created_at: datetime


class AffectedAppointment(BaseModel):
    id: UUID
    scheduled_at: datetime
    duration_minutes: int
    status: str
    pet_name: str | None = None
    owner_name: str | None = None


class TimeOffCreateResponse(TimeOffResponse):
    affected_appointments: list[AffectedAppointment] = []


class ClosedDatesResponse(BaseModel):
    """Whole-day closed dates (ISO strings) within a requested range."""
    vet_id: UUID
    closed_dates: list[str]
