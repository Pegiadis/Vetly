"""
Reminder schemas for request/response validation
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.reminder import ReminderType


class ReminderCreateRequest(BaseModel):
    """Request to create a reminder"""
    pet_id: UUID
    type: ReminderType
    title: str = Field(..., min_length=1, max_length=255)
    message: str | None = Field(None, max_length=2000)
    due_date: date
    reminder_days_before: int = Field(14, ge=1, le=365)


class ReminderResponse(BaseModel):
    """Reminder response schema"""
    model_config = {"from_attributes": True}

    id: UUID
    pet_id: UUID
    pet_name: str | None = None
    vet_id: UUID
    vet_name: str | None = None
    pet_owner_id: UUID
    type: ReminderType
    title: str
    message: str | None = None
    due_date: date
    reminder_date: date
    is_sent: bool
    is_dismissed: bool
    created_at: datetime


class ReminderListResponse(BaseModel):
    """Paginated list of reminders"""
    items: list[ReminderResponse]
    total: int
    page: int
    page_size: int


class ProcessRemindersResponse(BaseModel):
    """Response from processing due reminders"""
    processed: int
    message: str
