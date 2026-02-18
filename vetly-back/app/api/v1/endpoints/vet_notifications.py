"""
Vet notification API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.repositories.notification import NotificationRepository
from app.schemas.owner import NotificationPaginatedResponse, NotificationResponse

router = APIRouter()


@router.get("", response_model=NotificationPaginatedResponse)
def get_vet_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> NotificationPaginatedResponse:
    """Get notifications for the logged-in vet with pagination"""
    repo = NotificationRepository(db)
    skip = (page - 1) * page_size
    notifications, total = repo.get_by_vet(current_vet.id, skip=skip, limit=page_size)
    return NotificationPaginatedResponse(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total, page=page, page_size=page_size,
    )


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
