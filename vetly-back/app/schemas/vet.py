"""
Vet schemas for request/response validation
"""

from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, ConfigDict


class DayHours(BaseModel):
    """Working hours for a single day"""
    open: str | None = None
    close: str | None = None
    closed: bool = False


class WorkingHours(BaseModel):
    """Weekly working hours"""
    monday: DayHours | None = None
    tuesday: DayHours | None = None
    wednesday: DayHours | None = None
    thursday: DayHours | None = None
    friday: DayHours | None = None
    saturday: DayHours | None = None
    sunday: DayHours | None = None


class VetBase(BaseModel):
    """Shared vet fields"""
    name: str
    email: EmailStr
    specialty: str
    phone: str
    address: str
    city: str
    description: str | None = None
    image_url: str | None = None


class VetResponse(VetBase):
    """Vet response returned from API"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    license_number: str
    coordinates_lat: Decimal | None = None
    coordinates_lng: Decimal | None = None
    hours: dict | None = None
    is_on_call: bool
    is_verified: bool
    rating_average: Decimal
    reviews_count: int
    created_at: datetime
    updated_at: datetime


class VetListResponse(BaseModel):
    """Paginated list of vets"""
    items: list[VetResponse]
    total: int
    page: int
    page_size: int


class VetUpdateRequest(BaseModel):
    """Vet profile update request"""
    name: str | None = None
    specialty: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    description: str | None = None
    image_url: str | None = None
    coordinates_lat: Decimal | None = None
    coordinates_lng: Decimal | None = None


class VetHoursUpdateRequest(BaseModel):
    """Vet working hours update request"""
    hours: WorkingHours


class OnCallToggleRequest(BaseModel):
    """On-call status toggle request"""
    is_on_call: bool


class OnCallVetsResponse(BaseModel):
    """List of on-call vets (unpaginated)"""
    items: list[VetResponse]
    count: int


class AvailableSlotsResponse(BaseModel):
    """Response for available time slots"""
    date: str
    vet_id: UUID
    slots: list[str]
