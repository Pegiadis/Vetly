"""Schemas for the admin panel API."""
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

VetStatus = Literal["active", "invited", "suspended", "closed"]
OwnerStatus = Literal["active", "unverified", "suspended"]


class AdminMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str


class AdminVetCreate(BaseModel):
    """A vet account the team creates, usually after a demo."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=50)
    city: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=500)
    specialty: str = Field(..., min_length=2, max_length=255)
    license_number: str = Field(..., min_length=2, max_length=100)
    demo_request_id: UUID | None = None


class AdminVetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    license_number: str
    specialty: str
    city: str
    phone: str
    email_verified: bool
    is_verified: bool
    created_at: datetime
    slug: str | None = None
    deactivated_at: datetime | None = None
    status: VetStatus
    appointments_count: int
    clients_count: int


class AdminVetList(BaseModel):
    items: list[AdminVetItem]
    total: int
    page: int
    page_size: int


class AdminOwnerItem(BaseModel):
    """Account data only: no pets, medical records or messages."""
    id: UUID
    name: str
    email: str
    phone: str | None = None
    email_verified: bool
    suspended_at: datetime | None = None
    created_at: datetime
    status: OwnerStatus
    pets_count: int
    appointments_count: int


class AdminOwnerList(BaseModel):
    items: list[AdminOwnerItem]
    total: int
    page: int
    page_size: int


class VetCounts(BaseModel):
    active: int
    invited: int
    suspended: int
    closed: int


class DemoCounts(BaseModel):
    new: int
    total: int


class OwnerCounts(BaseModel):
    total: int
    unverified: int
    suspended: int


class AppointmentCounts(BaseModel):
    last_7_days: int
    last_30_days: int
    upcoming: int


class WeekRow(BaseModel):
    week_start: date
    demo_requests: int
    vets: int
    owners: int
    appointments: int


class AdminOverview(BaseModel):
    demo_requests: DemoCounts
    vets: VetCounts
    owners: OwnerCounts
    appointments: AppointmentCounts
    weeks: list[WeekRow]
