"""
Reminder schemas for request/response validation
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

REMINDER_TYPE_LABELS: dict[str, str] = {
    "vaccination": "Εμβολιασμός",
    "checkup": "Έλεγχος",
    "medication": "Φαρμακευτική Αγωγή",
    "custom": "Υπενθύμιση",
}


class ReminderCreateRequest(BaseModel):
    """Request to create a reminder"""
    pet_id: UUID
    type: str = Field(..., min_length=1, max_length=100)
    title: str | None = Field(None, max_length=255)
    message: str | None = Field(None, max_length=2000)
    due_date: date
    reminder_days_before: int = Field(14, ge=1, le=365)

    def get_title(self) -> str:
        """Return the title, auto-generating from type if not provided."""
        if self.title and self.title.strip():
            return self.title.strip()
        return REMINDER_TYPE_LABELS.get(self.type, self.type)


class ReminderResponse(BaseModel):
    """Reminder response schema"""
    model_config = {"from_attributes": True}

    id: UUID
    pet_id: UUID
    pet_name: str | None = None
    pet_image_url: str | None = None
    pet_type: str | None = None
    vet_id: UUID
    vet_name: str | None = None
    pet_owner_id: UUID
    type: str
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
