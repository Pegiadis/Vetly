"""
Review repository - data access layer
"""

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.db.base import Review


class ReviewRepository:
    """Repository for Review database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, review_id: UUID, vet_id: UUID) -> Review | None:
        """Get a specific review by ID for a vet"""
        query = (
            select(Review)
            .where(Review.id == review_id, Review.vet_id == vet_id)
            .options(joinedload(Review.pet_owner))
        )
        return self.db.scalar(query)

    def get_vet_reviews(
        self,
        vet_id: UUID,
        skip: int = 0,
        limit: int = 10,
    ) -> tuple[list[Review], int]:
        """
        Get reviews for a vet

        Args:
            vet_id: The vet's UUID
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (list of reviews, total count)
        """
        query = (
            select(Review)
            .where(Review.vet_id == vet_id)
            .options(joinedload(Review.pet_owner))
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        reviews = self.db.scalars(query).unique().all()

        count_query = select(func.count(Review.id)).where(Review.vet_id == vet_id)
        total = self.db.scalar(count_query) or 0

        return list(reviews), total

    def get_review_stats(self, vet_id: UUID) -> dict:
        """
        Get review statistics for a vet

        Args:
            vet_id: The vet's UUID

        Returns:
            Dictionary with total_reviews, average_rating, and rating_counts
        """
        # Get total and average
        stats_query = select(
            func.count(Review.id).label("total"),
            func.avg(Review.rating).label("average"),
        ).where(Review.vet_id == vet_id)

        result = self.db.execute(stats_query).first()
        total = result.total or 0
        average = float(result.average) if result.average else 0.0

        # Get rating distribution
        distribution_query = (
            select(
                Review.rating,
                func.count(Review.id).label("count"),
            )
            .where(Review.vet_id == vet_id)
            .group_by(Review.rating)
            .order_by(Review.rating.desc())
        )
        distribution_result = self.db.execute(distribution_query).all()

        rating_counts = {row.rating: row.count for row in distribution_result}

        return {
            "total_reviews": total,
            "average_rating": round(average, 2),
            "rating_counts": rating_counts,
        }

    def add_reply(self, review: Review, reply: str) -> Review:
        """Add a reply to a review"""
        review.reply = reply
        self.db.commit()
        self.db.refresh(review)
        return review
