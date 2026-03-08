"""
Appointment schemas for request/response validation
"""

from uuid import UUID
from decimal import Decimal
from datetime import datetime, date, time as TimeType
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


class AppointmentPetOwnerResponse(BaseModel):
    """Simplified pet owner response for appointments"""
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
    pet_owner_id: UUID
    pet_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    type: str
    status: str
    notes: str | None = None
    price: Decimal | None = None
    service_type_id: UUID | None = None
    group_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class AppointmentDetailResponse(AppointmentResponse):
    """Appointment response with pet and pet owner details"""
    pet: AppointmentPetResponse | None = None
    pet_owner: AppointmentPetOwnerResponse | None = None


class AppointmentListResponse(BaseModel):
    """Paginated list of appointments"""
    items: list[AppointmentDetailResponse]
    total: int
    page: int
    page_size: int


class VetCreateAppointmentRequest(BaseModel):
    """Request for a vet to create an appointment for a patient"""
    pet_id: UUID
    scheduled_at: datetime
    type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(30, ge=15, le=120)
    notes: str | None = Field(None, max_length=2000)
    service_type_id: UUID | None = None
    price: Decimal | None = Field(None, gt=0)


class AppointmentStatusUpdate(BaseModel):
    """Appointment status update request"""
    status: str = Field(..., pattern="^(confirmed|completed|cancelled)$")
    notes: str | None = Field(None, max_length=2000)


class AppointmentRejectRequest(BaseModel):
    """Appointment rejection request"""
    reason: str | None = Field(None, max_length=1000)


class ExaminationMedicationItem(BaseModel):
    """A single medication prescribed during examination"""
    name: str = Field(..., min_length=1, max_length=255)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., pattern="^(daily|weekly|once)$")
    time: TimeType = Field(default_factory=lambda: TimeType(8, 0))
    duration_days: int | None = Field(None, ge=1, le=365)
    notes: str | None = Field(None, max_length=500)


class CompleteExaminationRequest(BaseModel):
    """Request to complete an examination and record medical data"""
    diagnosis: str = Field(..., min_length=1, max_length=255)
    examination_notes: str | None = Field(None, max_length=2000)
    medications: list[ExaminationMedicationItem] = Field(default_factory=list)
