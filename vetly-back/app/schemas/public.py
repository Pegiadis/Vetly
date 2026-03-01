"""
Public-facing schemas (no authentication required)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PublicVetResponse(BaseModel):
    id: str
    name: str
    slug: str | None
    specialty: str | None
    city: str | None
    address: str | None
    phone: str | None
    image_url: str | None
    rating_average: float | None
    reviews_count: int
    is_on_call: bool
    working_hours: dict | None

    model_config = ConfigDict(from_attributes=True)


class PublicVetDetailResponse(PublicVetResponse):
    license_number: str | None
    coordinates_lat: float | None
    coordinates_lng: float | None
    description: str | None


class PublicVetListResponse(BaseModel):
    items: list[PublicVetResponse]
    total: int
    page: int
    page_size: int


class PublicReviewResponse(BaseModel):
    id: str
    rating: int
    comment: str | None
    created_at: datetime
    owner_name: str

    model_config = ConfigDict(from_attributes=True)


class PublicReviewListResponse(BaseModel):
    items: list[PublicReviewResponse]
    total: int
    page: int
    page_size: int
