"""
Owner reminder API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_pet_owner, get_db
from app.db.base import PetOwner
from app.schemas.reminder import ReminderListResponse, ReminderResponse
from app.services.reminder import ReminderService

router = APIRouter()


@router.get("", response_model=ReminderListResponse)
def get_owner_reminders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> ReminderListResponse:
    """Get paginated list of upcoming reminders for the logged-in pet owner"""
    service = ReminderService(db)
    return service.get_owner_reminders(current_owner.id, page=page, page_size=page_size)


@router.post("/{reminder_id}/dismiss", response_model=ReminderResponse)
def dismiss_reminder(
    reminder_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> ReminderResponse:
    """Dismiss a reminder (owner must be the recipient)"""
    service = ReminderService(db)
    return service.dismiss_reminder(reminder_id, current_owner.id)
