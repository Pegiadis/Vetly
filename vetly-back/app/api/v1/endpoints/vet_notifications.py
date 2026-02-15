"""
Vet notification API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.repositories.notification import NotificationRepository
from app.schemas.owner import NotificationResponse

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
def get_vet_notifications(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    """Get all notifications for the logged-in vet"""
    repo = NotificationRepository(db)
    notifications = repo.get_by_vet(current_vet.id)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_vet_notification_read(
    notification_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """Mark a single notification as read"""
    repo = NotificationRepository(db)
    notification = repo.get_by_id_for_vet(notification_id, current_vet.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    updated = repo.mark_read(notification)
    return NotificationResponse.model_validate(updated)


@router.post("/mark-all-read", status_code=204)
def mark_all_vet_notifications_read(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> None:
    """Mark all notifications as read"""
    repo = NotificationRepository(db)
    repo.mark_all_read_for_vet(current_vet.id)
