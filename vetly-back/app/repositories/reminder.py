"""
Repository for reminder database operations
"""

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Reminder


class ReminderRepository:
    """Repository for reminder database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        pet_id: UUID,
        vet_id: UUID,
        pet_owner_id: UUID,
        type: str,
        title: str,
        due_date: date,
        reminder_date: date,
        message: str | None = None,
    ) -> Reminder:
        """Create a reminder. Does NOT commit — caller is responsible."""
        reminder = Reminder(
            id=uuid4(),
            pet_id=pet_id,
            vet_id=vet_id,
            pet_owner_id=pet_owner_id,
            type=type,
            title=title,
            message=message,
            due_date=due_date,
            reminder_date=reminder_date,
        )
        self.db.add(reminder)
        return reminder

    def get_by_id(self, reminder_id: UUID) -> Reminder | None:
        """Get a reminder by its ID"""
        return self.db.scalar(select(Reminder).where(Reminder.id == reminder_id))

    def get_by_vet(
        self, vet_id: UUID, skip: int = 0, limit: int = 10
    ) -> tuple[list[Reminder], int]:
        """Get reminders created by a vet, newest first"""
        where = Reminder.vet_id == vet_id
        query = (
            select(Reminder)
            .where(where)
            .order_by(Reminder.due_date.asc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())
        total = self.db.scalar(select(func.count(Reminder.id)).where(where)) or 0
        return items, total

    def get_by_owner(
        self,
        owner_id: UUID,
        include_dismissed: bool = False,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Reminder], int]:
        """Get reminders for a pet owner, soonest due first"""
        conditions = [Reminder.pet_owner_id == owner_id]
        if not include_dismissed:
            conditions.append(Reminder.is_dismissed == False)

        query = (
            select(Reminder)
            .where(*conditions)
            .order_by(Reminder.due_date.asc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())
        total = (
            self.db.scalar(select(func.count(Reminder.id)).where(*conditions)) or 0
        )
        return items, total

    def get_due_reminders(self, check_date: date) -> list[Reminder]:
        """Get all reminders due on or before the given date that haven't been sent or dismissed"""
        query = select(Reminder).where(
            Reminder.reminder_date <= check_date,
            Reminder.is_sent == False,
            Reminder.is_dismissed == False,
        )
        return list(self.db.scalars(query).all())

    def mark_sent(self, reminder: Reminder) -> None:
        """Mark a reminder as sent. Does NOT commit — caller is responsible."""
        reminder.is_sent = True

    def mark_dismissed(self, reminder: Reminder) -> None:
        """Mark a reminder as dismissed. Does NOT commit — caller is responsible."""
        reminder.is_dismissed = True

    def delete(self, reminder: Reminder) -> None:
        """Delete a reminder. Does NOT commit — caller is responsible."""
        self.db.delete(reminder)
