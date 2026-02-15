"""
Vet Review Management API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.review import ReviewService
from app.schemas.review import (
    ReviewListResponse,
    ReviewDetailResponse,
    ReviewReplyRequest,
    ReviewStatsResponse,
)

router = APIRouter()


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ReviewListResponse:
    """Get paginated list of vet's reviews"""
    service = ReviewService(db)
    return service.list_reviews(
        vet_id=current_vet.id,
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=ReviewStatsResponse)
def get_review_stats(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ReviewStatsResponse:
    """Get review statistics for the vet"""
    service = ReviewService(db)
    return service.get_review_stats(vet_id=current_vet.id)


@router.post("/{review_id}/reply", response_model=ReviewDetailResponse)
def reply_to_review(
    review_id: UUID,
    data: ReviewReplyRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ReviewDetailResponse:
    """Add a reply to a review"""
    service = ReviewService(db)
    return service.reply_to_review(
        review_id=review_id,
        vet_id=current_vet.id,
        data=data,
    )
