"""
Vet service - business logic layer
"""

from uuid import UUID
from datetime import date, datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import Vet
from app.repositories.vet import VetRepository
from app.utils.slug import generate_unique_slug
from app.schemas.vet import (
    VetResponse,
    VetListResponse,
    VetUpdateRequest,
    VetHoursUpdateRequest,
    AvailableSlotsResponse,
    OnCallVetsResponse,
)


class VetService:
    """Service for Vet business logic"""

    def __init__(self, db: Session):
        self.repository = VetRepository(db)

    def list_vets(self, page: int = 1, page_size: int = 10) -> VetListResponse:
        """Get paginated list of vets"""
        skip = (page - 1) * page_size
        vets, total = self.repository.get_all(skip=skip, limit=page_size)

        return VetListResponse(
            items=[VetResponse.model_validate(vet) for vet in vets],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_vet(self, vet_id: UUID) -> VetResponse:
        """Get a single vet by ID"""
        vet = self.repository.get_by_id(vet_id)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vet not found",
            )

        return VetResponse.model_validate(vet)

    def search_vets(
        self, query: str | None = None, city: str | None = None, page: int = 1, page_size: int = 10
    ) -> VetListResponse:
        """Search vets by query or city"""
        skip = (page - 1) * page_size

        if city:
            vets, total = self.repository.get_by_city(city, skip=skip, limit=page_size)
        elif query:
            vets, total = self.repository.search(query, skip=skip, limit=page_size)
        else:
            vets, total = self.repository.get_all(skip=skip, limit=page_size)

        return VetListResponse(
            items=[VetResponse.model_validate(vet) for vet in vets],
            total=total,
            page=page,
            page_size=page_size,
        )

    def update_profile(self, vet: Vet, data: VetUpdateRequest) -> VetResponse:
        """Update a vet's profile"""
        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        # Regenerate slug when name changes
        if "name" in update_data:
            update_data["slug"] = generate_unique_slug(
                self.repository.db, update_data["name"], vet_id=vet.id
            )
        updated_vet = self.repository.update(vet, update_data)
        return VetResponse.model_validate(updated_vet)

    def update_hours(self, vet: Vet, data: VetHoursUpdateRequest) -> VetResponse:
        """Update a vet's working hours"""
        hours_dict = data.hours.model_dump(exclude_none=True)
        updated_vet = self.repository.update_hours(vet, hours_dict)
        return VetResponse.model_validate(updated_vet)

    def get_on_call_vets(self) -> OnCallVetsResponse:
        """Get all currently on-call vets"""
        vets = self.repository.get_on_call_vets()
        items = [VetResponse.model_validate(vet) for vet in vets]
        return OnCallVetsResponse(items=items, count=len(items))

    def toggle_on_call(self, vet: Vet, is_on_call: bool) -> VetResponse:
        """Toggle a vet's on-call status"""
        updated_vet = self.repository.toggle_on_call(vet, is_on_call)
        return VetResponse.model_validate(updated_vet)

    def get_available_slots(
        self, vet_id: UUID, target_date: date, slot_interval: int = 30
    ) -> AvailableSlotsResponse:
        """Compute available time slots for a vet on a given date"""
        vet = self.repository.get_by_id(vet_id)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vet not found",
            )

        # Get day name (monday, tuesday, etc.)
        day_name = target_date.strftime("%A").lower()

        # Check working hours
        if not vet.hours or day_name not in vet.hours:
            return AvailableSlotsResponse(date=target_date.isoformat(), vet_id=vet_id, slots=[])

        day_hours = vet.hours[day_name]
        if day_hours.get("closed", False):
            return AvailableSlotsResponse(date=target_date.isoformat(), vet_id=vet_id, slots=[])

        def _parse_time(t: str) -> datetime:
            h, m = map(int, t.split(":"))
            return datetime.combine(target_date, datetime.min.time().replace(hour=h, minute=m))

        def _generate_shift_slots(shift: dict) -> list[datetime]:
            """Generate slots for a single shift"""
            if not shift or not shift.get("open") or not shift.get("close"):
                return []
            shift_open = _parse_time(shift["open"])
            shift_close = _parse_time(shift["close"])
            slots = []
            current = shift_open
            while current + timedelta(minutes=slot_interval) <= shift_close:
                slots.append(current)
                current += timedelta(minutes=slot_interval)
            return slots

        # Collect shifts: support new format (morning/afternoon) and old format (open/close)
        morning = day_hours.get("morning")
        afternoon = day_hours.get("afternoon")

        if morning or afternoon:
            # New two-shift format
            all_slots = _generate_shift_slots(morning) + _generate_shift_slots(afternoon)
        elif day_hours.get("open") and day_hours.get("close"):
            # Backward compatibility: old format treated as single shift
            all_slots = _generate_shift_slots({"open": day_hours["open"], "close": day_hours["close"]})
        else:
            return AvailableSlotsResponse(date=target_date.isoformat(), vet_id=vet_id, slots=[])

        all_slots.sort()

        # Get booked appointments
        booked = self.repository.get_booked_slots(vet_id, target_date)

        # Build booked time ranges
        booked_ranges = []
        for apt in booked:
            apt_start = apt.scheduled_at
            apt_end = apt_start + timedelta(minutes=apt.duration_minutes)
            booked_ranges.append((apt_start, apt_end))

        # Filter out booked slots
        available = []
        for slot_start in all_slots:
            slot_end = slot_start + timedelta(minutes=slot_interval)
            is_booked = any(
                slot_start < apt_end and slot_end > apt_start
                for apt_start, apt_end in booked_ranges
            )
            if not is_booked:
                available.append(slot_start)

        # If today, filter out past slots
        now = datetime.utcnow()
        if target_date == now.date():
            available = [s for s in available if s > now]

        slot_strings = [s.strftime("%H:%M") for s in available]

        return AvailableSlotsResponse(
            date=target_date.isoformat(),
            vet_id=vet_id,
            slots=slot_strings,
        )
