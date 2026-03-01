"""
Public vet profile endpoints - no authentication required
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.review import Review
from app.models.vet import Vet
from app.models.pet_owner import PetOwner
from app.schemas.public import (
    PublicReviewListResponse,
    PublicReviewResponse,
    PublicVetDetailResponse,
    PublicVetListResponse,
    PublicVetResponse,
)

router = APIRouter()


def _vet_to_public_response(vet: Vet) -> dict:
    """Map Vet ORM object to public response dict."""
    return {
        "id": str(vet.id),
        "name": vet.name,
        "slug": vet.slug,
        "specialty": vet.specialty,
        "city": vet.city,
        "address": vet.address,
        "phone": vet.phone,
        "image_url": vet.image_url,
        "rating_average": float(vet.rating_average) if vet.rating_average is not None else None,
        "reviews_count": vet.reviews_count,
        "is_on_call": vet.is_on_call,
        "working_hours": vet.hours,
    }


def _vet_to_public_detail(vet: Vet) -> dict:
    """Map Vet ORM object to public detail response dict."""
    data = _vet_to_public_response(vet)
    data.update({
        "license_number": vet.license_number,
        "coordinates_lat": float(vet.coordinates_lat) if vet.coordinates_lat is not None else None,
        "coordinates_lng": float(vet.coordinates_lng) if vet.coordinates_lng is not None else None,
        "description": vet.description,
    })
    return data


def _resolve_vet(slug_or_id: str, db: Session) -> Vet:
    """Resolve a vet by slug first, then by UUID."""
    # Try slug first
    vet = db.scalar(select(Vet).where(Vet.slug == slug_or_id))
    if vet:
        return vet

    # Try UUID
    try:
        vet_uuid = uuid.UUID(slug_or_id)
        vet = db.scalar(select(Vet).where(Vet.id == vet_uuid))
    except ValueError:
        vet = None

    if not vet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vet not found",
        )
    return vet


@router.get("/vets", response_model=PublicVetListResponse)
def list_public_vets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    city: str = Query(None),
    specialty: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
) -> PublicVetListResponse:
    """List publicly visible vets with optional filters."""
    query = select(Vet)
    count_query = select(func.count(Vet.id))

    filters = []
    if city:
        filters.append(Vet.city.ilike(f"%{city}%"))
    if specialty:
        filters.append(Vet.specialty.ilike(f"%{specialty}%"))
    if search:
        search_filter = or_(
            Vet.name.ilike(f"%{search}%"),
            Vet.specialty.ilike(f"%{search}%"),
        )
        filters.append(search_filter)

    if filters:
        from sqlalchemy import and_
        combined = and_(*filters)
        query = query.where(combined)
        count_query = count_query.where(combined)

    total = db.scalar(count_query) or 0
    skip = (page - 1) * page_size
    vets = list(db.scalars(query.offset(skip).limit(page_size)).all())

    return PublicVetListResponse(
        items=[PublicVetResponse(**_vet_to_public_response(v)) for v in vets],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/vets/{slug_or_id}", response_model=PublicVetDetailResponse)
def get_public_vet(
    slug_or_id: str,
    db: Session = Depends(get_db),
) -> PublicVetDetailResponse:
    """Get a single vet's public profile by slug or UUID."""
    vet = _resolve_vet(slug_or_id, db)
    return PublicVetDetailResponse(**_vet_to_public_detail(vet))


@router.get("/vets/{slug_or_id}/reviews", response_model=PublicReviewListResponse)
def get_public_vet_reviews(
    slug_or_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> PublicReviewListResponse:
    """Get paginated reviews for a specific vet."""
    vet = _resolve_vet(slug_or_id, db)

    skip = (page - 1) * page_size

    total = db.scalar(
        select(func.count(Review.id)).where(Review.vet_id == vet.id)
    ) or 0

    rows = list(
        db.execute(
            select(Review, PetOwner.name.label("owner_name"))
            .join(PetOwner, Review.pet_owner_id == PetOwner.id)
            .where(Review.vet_id == vet.id)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(page_size)
        ).all()
    )

    items = [
        PublicReviewResponse(
            id=str(review.id),
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            owner_name=owner_name,
        )
        for review, owner_name in rows
    ]

    return PublicReviewListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
