"""
Repository for notification database operations
"""

from uuid import UUID, uuid4

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.db.base import Notification


class NotificationRepository:
    """Repository for notification database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        type: str,
        title: str,
        message: str,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ) -> Notification:
        """Create a notification. Does NOT commit — caller is responsible."""
        notification = Notification(
            id=uuid4(),
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
            type=type,
            title=title,
            message=message,
        )
        self.db.add(notification)
        return notification

    # --- Vet notification queries ---

    def get_by_vet(self, vet_id: UUID, skip: int = 0, limit: int = 10) -> tuple[list[Notification], int]:
        """Get notifications for a vet with pagination, newest first"""
        where = Notification.vet_id == vet_id
        query = (
            select(Notification)
            .where(where)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())
        total = self.db.scalar(select(func.count(Notification.id)).where(where)) or 0
        return items, total

    def get_by_id_for_vet(self, notification_id: UUID, vet_id: UUID) -> Notification | None:
        """Get a specific notification ensuring it belongs to the vet"""
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.vet_id == vet_id,
        )
        return self.db.scalar(query)

    def mark_read(self, notification: Notification) -> Notification:
        """Mark a single notification as read"""
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_read_for_vet(self, vet_id: UUID) -> int:
        """Mark all unread notifications as read for a vet"""
        stmt = (
            update(Notification)
            .where(
                Notification.vet_id == vet_id,
                Notification.is_read == False,
            )
            .values(is_read=True)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount

    # --- Unread helpers (used by polling endpoints) ---

    def count_unread_for_owner(self, owner_id: UUID) -> int:
        """Count unread notifications for a pet owner"""
        return self.db.scalar(
            select(func.count(Notification.id)).where(
                Notification.pet_owner_id == owner_id,
                Notification.is_read == False,
            )
        ) or 0

    def count_unread_for_vet(self, vet_id: UUID) -> int:
        """Count unread notifications for a vet"""
        return self.db.scalar(
            select(func.count(Notification.id)).where(
                Notification.vet_id == vet_id,
                Notification.is_read == False,
            )
        ) or 0

    def get_latest_unread_for_owner(self, owner_id: UUID) -> Notification | None:
        """Get the most recent unread notification for a pet owner"""
        query = (
            select(Notification)
            .where(
                Notification.pet_owner_id == owner_id,
                Notification.is_read == False,
            )
            .order_by(Notification.created_at.desc())
            .limit(1)
        )
        return self.db.scalar(query)

    def get_latest_unread_for_vet(self, vet_id: UUID) -> Notification | None:
        """Get the most recent unread notification for a vet"""
        query = (
            select(Notification)
            .where(
                Notification.vet_id == vet_id,
                Notification.is_read == False,
            )
            .order_by(Notification.created_at.desc())
            .limit(1)
        )
        return self.db.scalar(query)
