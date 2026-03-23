"""
Reminder service - business logic layer for automated reminders
"""

from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Pet, PetOwner, Reminder, Vet
from app.models.reminder import ReminderType
from app.repositories.notification import NotificationRepository
from app.repositories.reminder import ReminderRepository
from app.services.notification import NotificationService
from app.schemas.reminder import (
    ReminderCreateRequest,
    ReminderListResponse,
    ReminderResponse,
)


def _build_reminder_response(reminder: Reminder) -> ReminderResponse:
    """Build a ReminderResponse enriched with related names"""
    pet_name = reminder.pet.name if reminder.pet else None
    vet_name = reminder.vet.name if reminder.vet else None
    return ReminderResponse(
        id=reminder.id,
        pet_id=reminder.pet_id,
        pet_name=pet_name,
        vet_id=reminder.vet_id,
        vet_name=vet_name,
        pet_owner_id=reminder.pet_owner_id,
        type=reminder.type,
        title=reminder.title,
        message=reminder.message,
        due_date=reminder.due_date,
        reminder_date=reminder.reminder_date,
        is_sent=reminder.is_sent,
        is_dismissed=reminder.is_dismissed,
        created_at=reminder.created_at,
    )


class ReminderService:
    """Service for Reminder business logic"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ReminderRepository(db)
        self.notification_repo = NotificationRepository(db)
        self.notification_service = NotificationService(db)

    def create_reminder(
        self, vet_id: UUID, data: ReminderCreateRequest
    ) -> ReminderResponse:
        """Create a reminder for a pet. Calculates reminder_date from due_date - reminder_days_before."""
        # Look up the pet to get pet_owner_id
        pet = self.db.scalar(select(Pet).where(Pet.id == data.pet_id))
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        reminder_date = data.due_date - timedelta(days=data.reminder_days_before)

        reminder = self.repository.create(
            pet_id=data.pet_id,
            vet_id=vet_id,
            pet_owner_id=pet.pet_owner_id,
            type=data.type,
            title=data.title,
            message=data.message,
            due_date=data.due_date,
            reminder_date=reminder_date,
        )
        self.db.commit()
        self.db.refresh(reminder)

        # Notify owner (in-app + email)
        vet_name = self.db.scalar(select(Vet.name).where(Vet.id == vet_id)) or ""
        pet_name = pet.name or ""
        date_str = data.due_date.strftime("%d/%m/%Y")
        self.notification_service.notify_owner(
            owner_id=pet.pet_owner_id,
            type="reminder",
            title="Νέα υπενθύμιση",
            message=f"Ο κτηνίατρος {vet_name} δημιούργησε υπενθύμιση για {pet_name}: {data.title}",
            vet_id=vet_id,
            pet_name=pet_name,
            date_str=date_str,
        )

        return _build_reminder_response(reminder)

    def get_vet_reminders(
        self, vet_id: UUID, page: int = 1, page_size: int = 10
    ) -> ReminderListResponse:
        """Get paginated list of reminders created by a vet"""
        skip = (page - 1) * page_size
        reminders, total = self.repository.get_by_vet(vet_id, skip=skip, limit=page_size)
        return ReminderListResponse(
            items=[_build_reminder_response(r) for r in reminders],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_owner_reminders(
        self, owner_id: UUID, page: int = 1, page_size: int = 10
    ) -> ReminderListResponse:
        """Get paginated list of active (non-dismissed) reminders for a pet owner"""
        skip = (page - 1) * page_size
        reminders, total = self.repository.get_by_owner(
            owner_id, include_dismissed=False, skip=skip, limit=page_size
        )
        return ReminderListResponse(
            items=[_build_reminder_response(r) for r in reminders],
            total=total,
            page=page,
            page_size=page_size,
        )

    def dismiss_reminder(self, reminder_id: UUID, owner_id: UUID) -> ReminderResponse:
        """Mark a reminder as dismissed, verifying it belongs to the owner"""
        reminder = self.repository.get_by_id(reminder_id)
        if not reminder or reminder.pet_owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found",
            )
        if reminder.is_dismissed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reminder is already dismissed",
            )
        self.repository.mark_dismissed(reminder)
        self.db.commit()
        self.db.refresh(reminder)

        # Notify vet (in-app only, no email)
        owner_name = self.db.scalar(
            select(PetOwner.name).where(PetOwner.id == owner_id)
        ) or ""
        self.notification_service.notify_vet(
            vet_id=reminder.vet_id,
            type="reminder_dismissed",
            title="Υπενθύμιση απορρίφθηκε",
            message=f"Ο ιδιοκτήτης {owner_name} απέρριψε την υπενθύμιση: {reminder.title}",
        )

        return _build_reminder_response(reminder)

    def delete_reminder(self, reminder_id: UUID, vet_id: UUID) -> None:
        """Delete a reminder, verifying it was created by the vet"""
        reminder = self.repository.get_by_id(reminder_id)
        if not reminder or reminder.vet_id != vet_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found",
            )
        self.repository.delete(reminder)
        self.db.commit()

    def process_due_reminders(self) -> int:
        """
        Find all due reminders (reminder_date <= today, not sent, not dismissed),
        create a Notification for each owner, and mark reminders as sent.
        Returns the count of processed reminders.
        """
        today = date.today()
        due_reminders = self.repository.get_due_reminders(today)

        for reminder in due_reminders:
            pet_name = reminder.pet.name if reminder.pet else "your pet"
            due_str = reminder.due_date.strftime("%d/%m/%Y")
            self.notification_repo.create(
                pet_owner_id=reminder.pet_owner_id,
                type="reminder",
                title=f"Υπενθύμιση: {reminder.title}",
                message=f"Υπενθύμιση για {pet_name}: {reminder.title} στις {due_str}",
            )
            self.repository.mark_sent(reminder)

        self.db.commit()
        return len(due_reminders)

    def auto_create_vaccination_reminder(
        self, db: Session, pet_id: UUID, vet_id: UUID, vaccination_title: str
    ) -> None:
        """
        Automatically create a vaccination reminder after an examination with a vaccination event.
        Sets due_date to one year from today, reminder_date to 14 days before.
        """
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if not pet:
            return

        today = date.today()
        due_date = today + timedelta(days=365)
        reminder_date = due_date - timedelta(days=14)

        repo = ReminderRepository(db)
        repo.create(
            pet_id=pet_id,
            vet_id=vet_id,
            pet_owner_id=pet.pet_owner_id,
            type=ReminderType.vaccination,
            title=f"Επανεμβολιασμός: {vaccination_title}",
            message=f"Ο {vaccination_title} του {pet.name} χρειάζεται ανανέωση.",
            due_date=due_date,
            reminder_date=reminder_date,
        )
        # Caller is responsible for commit
