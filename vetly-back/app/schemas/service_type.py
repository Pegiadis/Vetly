"""
ServiceType schemas for request/response validation
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ServiceTypeCreate(BaseModel):
    """Request to create a new service type"""
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal = Field(..., gt=0)
    duration_minutes: int = Field(30, ge=5, le=480)


class ServiceTypeUpdate(BaseModel):
    """Request to update a service type"""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    price: Decimal | None = Field(None, gt=0)
    duration_minutes: int | None = Field(None, ge=5, le=480)
    is_active: bool | None = None


class ServiceTypeResponse(BaseModel):
    """Service type response returned from API"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vet_id: UUID
    name: str
    description: str | None = None
    price: Decimal
    duration_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ServiceTypeListResponse(BaseModel):
    """Paginated list of service types"""
    items: list[ServiceTypeResponse]
    total: int
    page: int
    page_size: int
