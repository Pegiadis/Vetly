"""
Notification service - helper for creating notifications from other services.
After creating the in-app notification, also sends an email notification
when EMAIL_NOTIFICATIONS_ENABLED is True.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vet import Vet
from app.models.pet_owner import PetOwner
from app.repositories.notification import NotificationRepository
from app.core.email_templates import (
    send_notification_email,
    appointment_confirmed_email,
    appointment_rejected_email,
    appointment_cancelled_by_owner_email,
    appointment_cancelled_by_vet_email,
    appointment_rescheduled_by_owner_email,
    appointment_rescheduled_by_vet_email,
    appointment_reminder_email,
    new_appointment_request_email,
    examination_completed_email,
    new_review_email,
    new_reminder_email,
)


class NotificationService:
    """Lightweight helper for creating notifications"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository(db)

    # ── helpers ───────────────────────────────────────────────────

    def _get_owner_email(self, owner_id: UUID) -> str | None:
        row = self.db.scalar(
            select(PetOwner.email).where(PetOwner.id == owner_id)
        )
        return row

    def _get_owner_name(self, owner_id: UUID) -> str:
        return self.db.scalar(
            select(PetOwner.name).where(PetOwner.id == owner_id)
        ) or ""

    def _get_vet_email(self, vet_id: UUID) -> str | None:
        return self.db.scalar(
            select(Vet.email).where(Vet.id == vet_id)
        )

    def _get_vet_name(self, vet_id: UUID) -> str:
        return self.db.scalar(
            select(Vet.name).where(Vet.id == vet_id)
        ) or ""

    # ── main notification methods ────────────────────────────────

    def notify_owner(
        self,
        owner_id: UUID,
        type: str,
        title: str,
        message: str,
        # Optional context for richer email templates
        vet_id: UUID | None = None,
        pet_name: str = "",
        date_str: str = "",
        service: str = "",
    ) -> None:
        """Create a notification for a pet owner and send an email."""
        self.repository.create(
            pet_owner_id=owner_id,
            type=type,
            title=title,
            message=message,
        )
        self.db.commit()

        # Send email notification
        self._send_owner_email(
            owner_id=owner_id,
            notification_type=type,
            title=title,
            message=message,
            vet_id=vet_id,
            pet_name=pet_name,
            date_str=date_str,
            service=service,
        )

    def notify_vet(
        self,
        vet_id: UUID,
        type: str,
        title: str,
        message: str,
        # Optional context for richer email templates
        owner_id: UUID | None = None,
        pet_name: str = "",
        date_str: str = "",
        service: str = "",
        rating: int = 0,
        comment: str = "",
    ) -> None:
        """Create a notification for a vet and send an email."""
        self.repository.create(
            vet_id=vet_id,
            type=type,
            title=title,
            message=message,
        )
        self.db.commit()

        # Send email notification
        self._send_vet_email(
            vet_id=vet_id,
            notification_type=type,
            owner_id=owner_id,
            pet_name=pet_name,
            date_str=date_str,
            service=service,
            rating=rating,
            comment=comment,
        )

    # ── email dispatch ───────────────────────────────────────────

    def _send_owner_email(
        self,
        owner_id: UUID,
        notification_type: str,
        vet_id: UUID | None,
        pet_name: str,
        date_str: str,
        service: str,
        title: str = "",
        message: str = "",
    ) -> None:
        """Pick the right template and send an email to the owner."""
        email = self._get_owner_email(owner_id)
        if not email:
            return

        owner_name = self._get_owner_name(owner_id)
        vet_name = self._get_vet_name(vet_id) if vet_id else ""

        result: tuple[str, str] | None = None

        if notification_type == "appointment_confirm":
            result = appointment_confirmed_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
                service=service,
            )
        elif notification_type == "appointment_reject":
            result = appointment_rejected_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "appointment_cancel":
            result = appointment_cancelled_by_vet_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "appointment_reschedule":
            result = appointment_rescheduled_by_vet_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "appointment_reminder":
            result = appointment_reminder_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
                service=service,
            )
        elif notification_type == "appointment_complete":
            result = examination_completed_email(
                owner_name=owner_name,
                vet_name=vet_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "reminder":
            result = new_reminder_email(
                vet_name=vet_name,
                pet_name=pet_name,
                title=title,
                due_date=date_str,
                message=message,
            )

        if result:
            subject, html = result
            send_notification_email(email, subject, html)

    def _send_vet_email(
        self,
        vet_id: UUID,
        notification_type: str,
        owner_id: UUID | None,
        pet_name: str,
        date_str: str,
        service: str,
        rating: int,
        comment: str,
    ) -> None:
        """Pick the right template and send an email to the vet."""
        email = self._get_vet_email(vet_id)
        if not email:
            return

        vet_name = self._get_vet_name(vet_id)
        owner_name = self._get_owner_name(owner_id) if owner_id else ""

        result: tuple[str, str] | None = None

        if notification_type == "appointment_new":
            result = new_appointment_request_email(
                vet_name=vet_name,
                owner_name=owner_name,
                pet_name=pet_name,
                date_str=date_str,
                service=service,
            )
        elif notification_type == "appointment_cancel":
            result = appointment_cancelled_by_owner_email(
                vet_name=vet_name,
                owner_name=owner_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "appointment_reschedule":
            result = appointment_rescheduled_by_owner_email(
                vet_name=vet_name,
                owner_name=owner_name,
                pet_name=pet_name,
                date_str=date_str,
            )
        elif notification_type == "review_new":
            result = new_review_email(
                vet_name=vet_name,
                owner_name=owner_name,
                rating=rating,
                comment=comment,
            )

        if result:
            subject, html = result
            send_notification_email(email, subject, html)
