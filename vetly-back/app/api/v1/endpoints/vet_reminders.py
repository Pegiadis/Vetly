"""
Vet reminder API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_vet, get_db
from app.db.base import Vet
from pydantic import BaseModel

from app.schemas.reminder import (
    ProcessRemindersResponse,
    ReminderCreateRequest,
    ReminderListResponse,
    ReminderResponse,
)
from app.services.reminder import ReminderService


class CustomReminderTypesRequest(BaseModel):
    types: list[str]


class CustomReminderTypesResponse(BaseModel):
    types: list[str]

router = APIRouter()


@router.get("", response_model=ReminderListResponse)
def get_vet_reminders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ReminderListResponse:
    """Get paginated list of reminders created by the logged-in vet"""
    service = ReminderService(db)
    return service.get_vet_reminders(current_vet.id, page=page, page_size=page_size)


@router.get("/types", response_model=CustomReminderTypesResponse)
def get_custom_reminder_types(
    current_vet: Vet = Depends(get_current_vet),
) -> CustomReminderTypesResponse:
    """Get the vet's custom reminder types"""
    return CustomReminderTypesResponse(types=current_vet.custom_reminder_types or [])


@router.put("/types", response_model=CustomReminderTypesResponse)
def update_custom_reminder_types(
    data: CustomReminderTypesRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> CustomReminderTypesResponse:
    """Update the vet's custom reminder types"""
    cleaned = [t.strip() for t in data.types if t.strip()]
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for t in cleaned:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    current_vet.custom_reminder_types = unique
    db.commit()
    return CustomReminderTypesResponse(types=unique)


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: ReminderCreateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ReminderResponse:
    """Create a new reminder for a patient"""
    service = ReminderService(db)
    return service.create_reminder(current_vet.id, data)


@router.post("/process", response_model=ProcessRemindersResponse)
def process_due_reminders(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ProcessRemindersResponse:
    """
    Trigger processing of all due reminders.
    Creates notifications for owners with reminders due today or earlier.
    In production this would be triggered by a cron job.
    """
    service = ReminderService(db)
    processed = service.process_due_reminders()
    return ProcessRemindersResponse(
        processed=processed,
        message=f"Processed {processed} due reminder(s) and sent notifications to owners.",
    )


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> None:
    """Delete a reminder (vet must be the creator)"""
    service = ReminderService(db)
    service.delete_reminder(reminder_id, current_vet.id)
