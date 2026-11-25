"""Schemas for the admin panel API."""
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

VetStatus = Literal["pending", "approved", "closed"]
OwnerStatus = Literal["active", "unverified", "suspended"]


class AdminMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str


class PendingVet(BaseModel):
    """Returned by the approve and revoke actions."""
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


class AdminVetItem(PendingVet):
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
    pending: int
    approved: int
    closed: int


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
    vets: int
    owners: int
    appointments: int


class AdminOverview(BaseModel):
    vets: VetCounts
    owners: OwnerCounts
    appointments: AppointmentCounts
    weeks: list[WeekRow]
