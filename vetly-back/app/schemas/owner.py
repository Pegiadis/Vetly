"""
Pet owner schemas for request/response validation
"""

from datetime import datetime, date, time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


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
    chip_number: str | None = None
    image_url: str | None = None
    cover_image_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PetPaginatedResponse(BaseModel):
    """Paginated list of pets"""
    items: list[PetResponse]
    total: int
    page: int
    page_size: int


class AppointmentCreateRequest(BaseModel):
    """Request to create a new appointment"""
    vet_id: UUID
    pet_id: UUID
    scheduled_at: datetime
    type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(default=30, ge=15, le=180)
    notes: str | None = Field(None, max_length=1000)
    service_type_id: UUID | None = None


class AppointmentBatchCreateRequest(BaseModel):
    """Request to create grouped appointments for multiple pets"""
    vet_id: UUID
    pet_ids: list[UUID] = Field(..., min_length=1, max_length=10)
    scheduled_at: datetime
    types: dict[str, str]
    duration_minutes: int = Field(default=30, ge=15, le=180)
    notes: str | None = Field(None, max_length=1000)
    service_type_id: UUID | None = None


class AppointmentRescheduleRequest(BaseModel):
    """Request to reschedule an appointment"""
    scheduled_at: datetime


class AppointmentPetInfo(BaseModel):
    """Nested pet info inside appointment response"""
    id: UUID
    name: str
    type: str
    breed: str | None = None
    image_url: str | None = None

    model_config = {"from_attributes": True}


class AppointmentVetInfo(BaseModel):
    """Nested vet info inside appointment response"""
    id: UUID
    name: str
    specialty: str
    address: str | None = None
    city: str | None = None
    image_url: str | None = None
    coordinates_lat: float | None = None
    coordinates_lng: float | None = None

    model_config = {"from_attributes": True}


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
    price: Decimal | None = None
    service_type_id: UUID | None = None
    group_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    pet: AppointmentPetInfo | None = None
    vet: AppointmentVetInfo | None = None

    model_config = {"from_attributes": True}


class AppointmentPaginatedResponse(BaseModel):
    """Paginated list of appointments"""
    items: list[AppointmentResponse]
    total: int
    page: int
    page_size: int


class VetListResponse(BaseModel):
    """Vet info for listing in owner booking"""
    id: UUID
    name: str
    specialty: str
    city: str | None = None
    address: str | None = None
    rating_average: float = 0
    reviews_count: int = 0
    image_url: str | None = None
    coordinates_lat: Decimal | None = None
    coordinates_lng: Decimal | None = None

    model_config = {"from_attributes": True}


class MedicalEventVetInfo(BaseModel):
    """Nested vet info inside medical event"""
    id: UUID
    name: str
    specialty: str

    model_config = {"from_attributes": True}


class OwnerMedicalEventResponse(BaseModel):
    """Medical event response for owner endpoints"""
    id: UUID
    pet_id: UUID
    vet_id: UUID | None = None
    date: date
    title: str
    notes: str | None = None
    event_type: str
    created_at: datetime
    vet: MedicalEventVetInfo | None = None

    model_config = {"from_attributes": True}


class OwnerMedicalHistoryResponse(BaseModel):
    """Medical history response for owner endpoints"""
    items: list[OwnerMedicalEventResponse]
    total: int
    page: int
    page_size: int


class MedicationPetInfo(BaseModel):
    """Nested pet info inside medication response"""
    id: UUID
    name: str
    type: str
    image_url: str | None = None

    model_config = {"from_attributes": True}


class MedicationResponse(BaseModel):
    """Medication response for owner endpoints"""
    id: UUID
    pet_id: UUID
    name: str
    dosage: str
    frequency: str
    time: time
    start_date: date
    end_date: date | None = None
    notes: str | None = None
    is_active: bool
    created_at: datetime
    pet: MedicationPetInfo | None = None

    model_config = {"from_attributes": True}


class MedicationPaginatedResponse(BaseModel):
    """Paginated list of medications"""
    items: list[MedicationResponse]
    total: int
    page: int
    page_size: int


# --- Owner Reviews ---

class ReviewVetInfo(BaseModel):
    """Nested vet info inside owner review response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    specialty: str
    image_url: str | None = None


class OwnerReviewResponse(BaseModel):
    """Review response for owner endpoints"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vet_id: UUID
    pet_owner_id: UUID
    appointment_id: UUID | None = None
    rating: int
    comment: str
    reply: str | None = None
    created_at: datetime
    updated_at: datetime
    vet: ReviewVetInfo | None = None


class OwnerReviewPaginatedResponse(BaseModel):
    """Paginated list of reviews"""
    items: list[OwnerReviewResponse]
    total: int
    page: int
    page_size: int


class OwnerReviewCreateRequest(BaseModel):
    """Request to create a review"""
    vet_id: UUID
    appointment_id: UUID | None = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=2000)


class OwnerReviewUpdateRequest(BaseModel):
    """Request to update a review"""
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = Field(None, min_length=1, max_length=2000)


# --- Notifications ---

class NotificationResponse(BaseModel):
    """Notification response for owner endpoints"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationPaginatedResponse(BaseModel):
    """Paginated list of notifications"""
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    """Unread notification count"""
    count: int


# --- Owner Profile Update ---

class OwnerProfileUpdateRequest(BaseModel):
    """Request to update the owner profile"""
    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)


# --- Pet CRUD ---

class PetCreateRequest(BaseModel):
    """Request to create a new pet"""
    name: str = Field(..., min_length=1, max_length=30)
    type: str = Field(..., min_length=1, max_length=20)
    breed: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=50)
    weight: float = Field(..., gt=0, le=200)
    gender: str = Field(..., min_length=1, max_length=10)
    chip_number: str | None = Field(None, pattern=r'^\d{15}$')


class PetUpdateRequest(BaseModel):
    """Request to update a pet"""
    name: str | None = Field(None, min_length=1, max_length=30)
    breed: str | None = Field(None, min_length=1, max_length=100)
    age: int | None = Field(None, ge=0, le=50)
    weight: float | None = Field(None, gt=0, le=200)
    chip_number: str | None = Field(None, pattern=r'^\d{15}$')
