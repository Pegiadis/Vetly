"""
Review service - business logic layer
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.review import ReviewRepository
from app.services.notification import NotificationService
from app.schemas.review import (
    ReviewDetailResponse,
    ReviewListResponse,
    ReviewReplyRequest,
    ReviewStatsResponse,
    ReviewPetOwnerResponse,
    RatingDistribution,
)


class ReviewService:
    """Service for Review business logic"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ReviewRepository(db)
        self.notifications = NotificationService(db)

    def _build_detail_response(self, review) -> ReviewDetailResponse:
        """Build a detailed review response with pet owner info"""
        response = ReviewDetailResponse.model_validate(review)
        if review.pet_owner:
            response.pet_owner = ReviewPetOwnerResponse.model_validate(review.pet_owner)
        return response

    def list_reviews(
        self,
        vet_id: UUID,
        page: int = 1,
        page_size: int = 10,
    ) -> ReviewListResponse:
        """Get paginated list of vet's reviews"""
        skip = (page - 1) * page_size
        reviews, total = self.repository.get_vet_reviews(
            vet_id=vet_id,
            skip=skip,
            limit=page_size,
        )

        return ReviewListResponse(
            items=[self._build_detail_response(review) for review in reviews],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_review_stats(self, vet_id: UUID) -> ReviewStatsResponse:
        """Get review statistics for a vet"""
        stats = self.repository.get_review_stats(vet_id)

        # Build rating distribution with percentages
        total = stats["total_reviews"]
        rating_counts = stats["rating_counts"]

        distribution = []
        for rating in range(5, 0, -1):  # 5 to 1
            count = rating_counts.get(rating, 0)
            percentage = (count / total * 100) if total > 0 else 0
            distribution.append(
                RatingDistribution(
                    rating=rating,
                    count=count,
                    percentage=round(percentage, 1),
                )
            )

        return ReviewStatsResponse(
            total_reviews=stats["total_reviews"],
            average_rating=stats["average_rating"],
            rating_distribution=distribution,
        )

    def reply_to_review(
        self,
        review_id: UUID,
        vet_id: UUID,
        data: ReviewReplyRequest,
    ) -> ReviewDetailResponse:
        """Add a reply to a review"""
        review = self.repository.get_by_id(review_id, vet_id)

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        updated = self.repository.add_reply(review, data.reply)

        # Notify owner
        from app.db.base import Vet
        vet = self.db.get(Vet, vet_id)
        vet_name = vet.name if vet else ""
        self.notifications.notify_owner(
            review.pet_owner_id,
            type="reply",
            title="Απάντηση σε αξιολόγηση",
            message=f"Ο {vet_name} απάντησε στην αξιολόγησή σας",
        )

        return self._build_detail_response(updated)

    def update_reply(
        self,
        review_id: UUID,
        vet_id: UUID,
        data: ReviewReplyRequest,
    ) -> ReviewDetailResponse:
        """Update an existing reply on a review"""
        review = self.repository.get_by_id(review_id, vet_id)

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        if not review.reply:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No reply exists to update",
            )

        updated = self.repository.update_reply(review, data.reply)
        return self._build_detail_response(updated)

    def delete_reply(
        self,
        review_id: UUID,
        vet_id: UUID,
    ) -> ReviewDetailResponse:
        """Delete a reply from a review"""
        review = self.repository.get_by_id(review_id, vet_id)

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        if not review.reply:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No reply exists to delete",
            )

        updated = self.repository.delete_reply(review)
        return self._build_detail_response(updated)
