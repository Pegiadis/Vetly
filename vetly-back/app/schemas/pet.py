"""
Pet schemas for request/response validation
"""

from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class PetOwnerResponse(BaseModel):
    """Pet owner (user) response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    phone: str | None = None
    image_url: str | None = None


class PetResponse(BaseModel):
    """Pet response returned from API"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    type: str
    breed: str
    age: int
    weight: float
    gender: str
    chip_number: str | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class PetWithOwnerResponse(PetResponse):
    """Pet response with owner details"""
    owner: PetOwnerResponse | None = None


class PetListResponse(BaseModel):
    """Paginated list of pets"""
    items: list[PetResponse]
    total: int
    page: int
    page_size: int


class MedicalEventResponse(BaseModel):
    """Medical event response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pet_id: UUID
    vet_id: UUID | None = None
    date: date
    title: str
    notes: str | None = None
    event_type: str
    created_at: datetime


class MedicalHistoryResponse(BaseModel):
    """Patient medical history response"""
    items: list[MedicalEventResponse]
    total: int
