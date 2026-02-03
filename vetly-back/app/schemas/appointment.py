"""
Appointment schemas for request/response validation
"""

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.pet import PetResponse, PetOwnerResponse


class AppointmentPetResponse(BaseModel):
    """Simplified pet response for appointments"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    breed: str
    image_url: str | None = None


class AppointmentUserResponse(BaseModel):
    """Simplified user response for appointments"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    phone: str | None = None


class AppointmentResponse(BaseModel):
    """Appointment response returned from API"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vet_id: UUID
    user_id: UUID
    pet_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    type: str
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class AppointmentDetailResponse(AppointmentResponse):
    """Appointment response with pet and user details"""
    pet: AppointmentPetResponse | None = None
    user: AppointmentUserResponse | None = None


class AppointmentListResponse(BaseModel):
    """Paginated list of appointments"""
    items: list[AppointmentDetailResponse]
    total: int
    page: int
    page_size: int


class AppointmentStatusUpdate(BaseModel):
    """Appointment status update request"""
    status: str = Field(..., pattern="^(confirmed|completed|cancelled)$")
    notes: str | None = None


class AppointmentRejectRequest(BaseModel):
    """Appointment rejection request"""
    reason: str | None = None
