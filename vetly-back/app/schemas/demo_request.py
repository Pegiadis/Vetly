"""Schemas for demo requests."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

DemoStatus = Literal["new", "contacted", "converted", "closed"]


class DemoRequestCreate(BaseModel):
    """The public form. `website` is a hidden field people never fill in."""
    name: str = Field(..., min_length=2, max_length=255)
    clinic_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=50)
    city: str = Field(..., min_length=2, max_length=100)
    message: str | None = Field(None, max_length=2000)
    website: str | None = Field(None, max_length=500)

    @field_validator("name", "clinic_name", "phone", "city", "message")
    @classmethod
    def strip(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class DemoRequestItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    clinic_name: str
    email: str
    phone: str
    city: str
    message: str | None = None
    status: DemoStatus
    vet_id: UUID | None = None
    created_at: datetime


class DemoRequestList(BaseModel):
    items: list[DemoRequestItem]
    total: int
    page: int
    page_size: int


class DemoRequestUpdate(BaseModel):
    status: DemoStatus
