"""
Service for vet time off / closures
"""

from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.vet_time_off import VetTimeOffRepository
from app.schemas.vet_time_off import (
    AffectedAppointment,
    ClosedDatesResponse,
    TimeOffCreate,
    TimeOffCreateResponse,
    TimeOffResponse,
)
from app.services.scheduling import ATHENS

MAX_RANGE_DAYS = 366


class VetTimeOffService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = VetTimeOffRepository(db)

    def list_upcoming(self, vet_id: UUID) -> list[TimeOffResponse]:
        today = datetime.now(ATHENS).date()
        return [TimeOffResponse.model_validate(e) for e in self.repository.list_upcoming(vet_id, today)]

    def create(self, vet_id: UUID, data: TimeOffCreate) -> TimeOffCreateResponse:
        if (data.end_date - data.start_date).days > MAX_RANGE_DAYS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Η περίοδος δεν μπορεί να ξεπερνά τον ένα χρόνο.")
        if data.end_date < datetime.now(ATHENS).date():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Η περίοδος πρέπει να περιλαμβάνει σημερινή ή μελλοντική ημερομηνία.")
        entry = self.repository.create(vet_id=vet_id, **data.model_dump())
        affected = [
            AffectedAppointment(
                id=a.id,
                scheduled_at=a.scheduled_at,
                duration_minutes=a.duration_minutes or 30,
                status=getattr(a.status, "value", str(a.status)),
                pet_name=a.pet.name if a.pet else None,
                owner_name=a.pet_owner.name if a.pet_owner else None,
            )
            for a in self.repository.active_appointments_in(vet_id, entry)
        ]
        return TimeOffCreateResponse(**TimeOffResponse.model_validate(entry).model_dump(), affected_appointments=affected)

    def delete(self, vet_id: UUID, entry_id: UUID) -> None:
        entry = self.repository.get(entry_id, vet_id)
        if not entry:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Η περίοδος δεν βρέθηκε.")
        self.repository.delete(entry)

    def closed_dates(self, vet_id: UUID, first: date, last: date) -> ClosedDatesResponse:
        """Dates in [first, last] fully closed by a whole-day closure."""
        if last < first or (last - first).days > MAX_RANGE_DAYS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Μη έγκυρο εύρος ημερομηνιών.")
        days: set[date] = set()
        for entry in self.repository.list_in_range(vet_id, first, last):
            if entry.start_time and entry.end_time:
                continue
            day = max(entry.start_date, first)
            while day <= min(entry.end_date, last):
                days.add(day)
                day += timedelta(days=1)
        return ClosedDatesResponse(vet_id=vet_id, closed_dates=[d.isoformat() for d in sorted(days)])
