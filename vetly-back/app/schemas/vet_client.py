"""
Vet client management schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# --- Pet schemas ---

class VetClientPetResponse(BaseModel):
    id: UUID
    name: str
    type: str
    breed: str | None = None
    age: int | None = None
    weight: float | None = None
    gender: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VetClientPetCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    type: str = Field(..., description="Dog, Cat, or Other")
    breed: str | None = Field(None, max_length=100)
    age: int | None = Field(None, ge=0)
    weight: float | None = Field(None, ge=0)
    gender: str | None = Field(None, max_length=10)
    notes: str | None = Field(None, max_length=2000)


class VetClientPetUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=30)
    type: str | None = Field(None, max_length=20)
    breed: str | None = Field(None, max_length=100)
    age: int | None = Field(None, ge=0)
    weight: float | None = Field(None, ge=0)
    gender: str | None = Field(None, max_length=10)
    notes: str | None = Field(None, max_length=2000)


# --- Linked pet schema (real Pet records for linked clients) ---

class LinkedPetResponse(BaseModel):
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

    model_config = {"from_attributes": True}


# --- Client schemas ---

class VetClientResponse(BaseModel):
    id: UUID
    vet_id: UUID
    pet_owner_id: UUID | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    pets: list[VetClientPetResponse] = []
    linked_pets: list[LinkedPetResponse] = []

    model_config = {"from_attributes": True}


class VetClientListItem(BaseModel):
    id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    image_url: str | None = None
    status: str
    pet_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class VetClientListResponse(BaseModel):
    items: list[VetClientListItem]
    total: int
    page: int
    page_size: int


class VetClientCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=2000)


class VetClientUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=2000)


# --- Invite schemas ---

class InviteLinkResponse(BaseModel):
    invite_url: str
    expires_at: datetime


class InviteInfoResponse(BaseModel):
    vet_name: str
    client_name: str
    client_email: str | None = None


class InviteRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
