"""
Notification service - helper for creating notifications from other services.
After creating the in-app notification, also sends an email notification
when EMAIL_NOTIFICATIONS_ENABLED is True.
"""

import logging
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


logger = logging.getLogger(__name__)


class NotificationService:
    """Lightweight helper for creating notifications"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository(db)
        # Emails built during a deferred notify_* call, released by
        # release_emails() once the caller's transaction has committed.
        self.outbox: list[tuple[str, str, str]] = []
        self._deferring = False

    # ── deferred email delivery ──────────────────────────────────

    def _emit(self, to_email: str, subject: str, html: str) -> None:
        """Send an email now, or queue it in the outbox when deferring."""
        if self._deferring:
            self.outbox.append((to_email, subject, html))
        else:
            send_notification_email(to_email, subject, html)

    def release_emails(self, background=None) -> None:
        """Hand queued emails to the delivery mechanism. Call only after commit.

        With a FastAPI BackgroundTasks they go out after the response is sent;
        without one they are sent inline and a failure is logged, not raised.
        """
        emails, self.outbox = self.outbox, []
        for to_email, subject, html in emails:
            if background is not None:
                background.add_task(_send_quietly, to_email, subject, html)
            else:
                _send_quietly(to_email, subject, html)

    def discard_emails(self) -> None:
        """Drop queued emails (the transaction that produced them rolled back)."""
        self.outbox = []

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
        commit: bool = True,
        defer_email: bool = False,
    ) -> None:
        """Create a notification for a pet owner and send an email.

        commit=False leaves the commit to the caller and implies defer_email,
        so no email can go out before the caller's transaction is saved.
        """
        self.repository.create(
            pet_owner_id=owner_id,
            type=type,
            title=title,
            message=message,
        )
        if commit:
            self.db.commit()
        else:
            self.db.flush()
        self._deferring = defer_email or not commit

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
        self._deferring = False

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
        appointment_id: UUID | None = None,
        commit: bool = True,
        defer_email: bool = False,
    ) -> None:
        """Create a notification for a vet and send an email.

        commit=False leaves the commit to the caller and implies defer_email.
        """
        self.repository.create(
            vet_id=vet_id,
            appointment_id=appointment_id,
            type=type,
            title=title,
            message=message,
        )
        if commit:
            self.db.commit()
        else:
            self.db.flush()
        self._deferring = defer_email or not commit

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
        self._deferring = False

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
        owner = self.db.get(PetOwner, owner_id)
        if not owner:
            return
        if notification_type.startswith("appointment_") and not owner.email_appointments:
            return
        if notification_type == "reminder" and not owner.email_reminders:
            return
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
            self._emit(email, subject, html)

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
        vet = self.db.get(Vet, vet_id)
        if vet is None or vet.deactivated_at is not None:
            return
        if notification_type == "appointment_new" and not vet.email_new_bookings:
            return
        if notification_type in ("appointment_cancel", "appointment_reschedule") and not vet.email_cancellations:
            return
        if notification_type == "review_new" and not vet.email_reviews:
            return
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
            self._emit(email, subject, html)


def _send_quietly(to_email: str, subject: str, html: str) -> None:
    """Send one notification email; a mail failure is logged, never raised."""
    try:
        send_notification_email(to_email, subject, html)
    except Exception:
        logger.exception("Notification email could not be sent")
