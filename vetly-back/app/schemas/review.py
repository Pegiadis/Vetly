"""
Review schemas for request/response validation
"""

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReviewPetOwnerResponse(BaseModel):
    """Simplified pet owner response for reviews"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    image_url: str | None = None


class ReviewResponse(BaseModel):
    """Review response returned from API"""
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


class ReviewDetailResponse(ReviewResponse):
    """Review response with pet owner details"""
    pet_owner: ReviewPetOwnerResponse | None = None


class ReviewListResponse(BaseModel):
    """Paginated list of reviews"""
    items: list[ReviewDetailResponse]
    total: int
    page: int
    page_size: int


class ReviewReplyRequest(BaseModel):
    """Review reply request"""
    reply: str = Field(..., min_length=1, max_length=1000)


class RatingDistribution(BaseModel):
    """Rating distribution"""
    rating: int
    count: int
    percentage: float


class ReviewStatsResponse(BaseModel):
    """Review statistics response"""
    total_reviews: int
    average_rating: float
    rating_distribution: list[RatingDistribution]
