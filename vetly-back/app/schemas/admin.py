"""Schemas for the admin vet-verification API."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PendingVet(BaseModel):
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


class PendingVetList(BaseModel):
    items: list[PendingVet]
    total: int
