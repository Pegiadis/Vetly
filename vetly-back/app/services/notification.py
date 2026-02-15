"""
Notification service - helper for creating notifications from other services
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.notification import NotificationRepository


class NotificationService:
    """Lightweight helper for creating notifications"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository(db)

    def notify_owner(
        self, owner_id: UUID, type: str, title: str, message: str
    ) -> None:
        """Create a notification for a pet owner"""
        self.repository.create(
            pet_owner_id=owner_id,
            type=type,
            title=title,
            message=message,
        )
        self.db.commit()

    def notify_vet(
        self, vet_id: UUID, type: str, title: str, message: str
    ) -> None:
        """Create a notification for a vet"""
        self.repository.create(
            vet_id=vet_id,
            type=type,
            title=title,
            message=message,
        )
        self.db.commit()
