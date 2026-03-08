"""
Authentication schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class VetRegisterRequest(BaseModel):
    """Vet registration request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=2, max_length=255)
    specialty: str = Field(..., min_length=2, max_length=255)
    license_number: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=5, max_length=50)
    address: str = Field(..., min_length=5, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(None, max_length=2000)
    image_url: str | None = Field(None, max_length=500)


class PetOwnerRegisterRequest(BaseModel):
    """Pet owner registration request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=2, max_length=255)
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
