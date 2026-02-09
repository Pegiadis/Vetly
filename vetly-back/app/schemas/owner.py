"""
Pet owner schemas for request/response validation
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PetOwnerResponse(BaseModel):
    """Pet owner response schema"""
    id: UUID
    email: str
    name: str
    phone: str | None = None
    address: str | None = None
    image_url: str | None = None
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PetResponse(BaseModel):
    """Pet response for owner endpoints"""
    id: UUID
    name: str
    type: str
    breed: str | None = None
    age: int | None = None
    weight: float | None = None
    gender: str | None = None
    image_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentCreateRequest(BaseModel):
    """Request to create a new appointment"""
    vet_id: UUID
    pet_id: UUID
    scheduled_at: datetime
    type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(default=30, ge=15, le=180)
    notes: str | None = Field(None, max_length=1000)


class AppointmentResponse(BaseModel):
    """Appointment response for owner endpoints"""
    id: UUID
    vet_id: UUID
    pet_id: UUID
    pet_owner_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    type: str
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VetListResponse(BaseModel):
    """Vet info for listing in owner booking"""
    id: UUID
    name: str
    specialty: str
    city: str | None = None
    rating_average: float = 0
    reviews_count: int = 0
    image_url: str | None = None

    model_config = {"from_attributes": True}
