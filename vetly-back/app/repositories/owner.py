"""
Repository for pet owner related database operations
"""

from uuid import UUID
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.db.base import Pet, Appointment, Vet, PetOwner, MedicalEvent, Medication, Review, Notification
from app.models.appointment import AppointmentStatus


class OwnerRepository:
    """Repository for pet owner database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_pets_by_owner_id(self, owner_id: UUID) -> list[Pet]:
        """Get all pets for a pet owner"""
        query = select(Pet).where(Pet.pet_owner_id == owner_id).order_by(Pet.name)
        return list(self.db.scalars(query).all())

    def get_pet_by_id(self, pet_id: UUID, owner_id: UUID) -> Pet | None:
        """Get a specific pet by ID, ensuring it belongs to the owner"""
        query = select(Pet).where(Pet.id == pet_id, Pet.pet_owner_id == owner_id)
        return self.db.scalar(query)

    def get_appointments_by_owner_id(self, owner_id: UUID) -> list[Appointment]:
        """Get all appointments for a pet owner with pet and vet details"""
        query = (
            select(Appointment)
            .options(joinedload(Appointment.pet), joinedload(Appointment.vet))
            .where(Appointment.pet_owner_id == owner_id)
            .order_by(Appointment.scheduled_at.desc())
        )
        return list(self.db.scalars(query).unique().all())

    def get_upcoming_appointments(self, owner_id: UUID) -> list[Appointment]:
        """Get upcoming appointments for a pet owner with pet and vet details"""
        now = datetime.utcnow()
        query = (
            select(Appointment)
            .options(joinedload(Appointment.pet), joinedload(Appointment.vet))
            .where(
                Appointment.pet_owner_id == owner_id,
                Appointment.scheduled_at >= now,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
            .order_by(Appointment.scheduled_at)
        )
        return list(self.db.scalars(query).unique().all())

    def create_appointment(
        self,
        pet_owner_id: UUID,
        vet_id: UUID,
        pet_id: UUID,
        scheduled_at: datetime,
        appointment_type: str,
        duration_minutes: int,
        notes: str | None = None,
    ) -> Appointment:
        """Create a new appointment"""
        appointment = Appointment(
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
            pet_id=pet_id,
            scheduled_at=scheduled_at,
            type=appointment_type,
            duration_minutes=duration_minutes,
            notes=notes,
            status=AppointmentStatus.PENDING,
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def get_vet_by_id(self, vet_id: UUID) -> Vet | None:
        """Get a vet by ID"""
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def get_all_vets(self, verified_only: bool = True) -> list[Vet]:
        """Get all vets, optionally filtering for verified ones only"""
        query = select(Vet).order_by(Vet.name)
        if verified_only:
            query = query.where(Vet.is_verified == True)
        return list(self.db.scalars(query).all())

    def get_pet_ids_for_owner(self, owner_id: UUID) -> list[UUID]:
        """Get all pet IDs belonging to an owner"""
        query = select(Pet.id).where(Pet.pet_owner_id == owner_id)
        return list(self.db.scalars(query).all())

    def get_medical_history_for_pet(
        self, pet_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[list[MedicalEvent], int]:
        """Get medical history for a pet with vet details"""
        query = (
            select(MedicalEvent)
            .options(joinedload(MedicalEvent.vet))
            .where(MedicalEvent.pet_id == pet_id)
            .order_by(MedicalEvent.date.desc())
            .offset(skip)
            .limit(limit)
        )
        events = self.db.scalars(query).unique().all()

        count_query = select(func.count(MedicalEvent.id)).where(
            MedicalEvent.pet_id == pet_id
        )
        total = self.db.scalar(count_query) or 0

        return list(events), total

    def get_medications_for_owner(
        self, owner_id: UUID, is_active: bool | None = None
    ) -> list[Medication]:
        """Get all medications for an owner's pets"""
        pet_ids = self.get_pet_ids_for_owner(owner_id)
        if not pet_ids:
            return []

        query = (
            select(Medication)
            .options(joinedload(Medication.pet))
            .where(Medication.pet_id.in_(pet_ids))
        )
        if is_active is not None:
            query = query.where(Medication.is_active == is_active)
        query = query.order_by(Medication.is_active.desc(), Medication.name)

        return list(self.db.scalars(query).unique().all())

    def get_medication_by_id(self, medication_id: UUID, owner_id: UUID) -> Medication | None:
        """Get a medication by ID, ensuring it belongs to one of the owner's pets"""
        pet_ids = self.get_pet_ids_for_owner(owner_id)
        if not pet_ids:
            return None
        query = select(Medication).where(
            Medication.id == medication_id,
            Medication.pet_id.in_(pet_ids),
        )
        return self.db.scalar(query)

    def delete_medication(self, medication: Medication) -> None:
        """Delete a medication"""
        self.db.delete(medication)
        self.db.commit()

    # --- Reviews ---

    def get_reviews_by_owner(self, owner_id: UUID) -> list[Review]:
        """Get all reviews by an owner with vet details"""
        query = (
            select(Review)
            .options(joinedload(Review.vet))
            .where(Review.pet_owner_id == owner_id)
            .order_by(Review.created_at.desc())
        )
        return list(self.db.scalars(query).unique().all())

    def get_review_by_id(self, review_id: UUID, owner_id: UUID) -> Review | None:
        """Get a specific review by ID, ensuring it belongs to the owner"""
        query = (
            select(Review)
            .options(joinedload(Review.vet))
            .where(Review.id == review_id, Review.pet_owner_id == owner_id)
        )
        return self.db.scalar(query)

    def create_review(
        self,
        pet_owner_id: UUID,
        vet_id: UUID,
        rating: int,
        comment: str,
        appointment_id: UUID | None = None,
    ) -> Review:
        """Create a new review"""
        review = Review(
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
            appointment_id=appointment_id,
            rating=rating,
            comment=comment,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def update_review(self, review: Review, rating: int | None, comment: str | None) -> Review:
        """Update a review"""
        if rating is not None:
            review.rating = rating
        if comment is not None:
            review.comment = comment
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete_review(self, review: Review) -> None:
        """Delete a review"""
        self.db.delete(review)
        self.db.commit()

    def update_vet_rating(self, vet_id: UUID) -> None:
        """Recalculate and update the vet's rating_average and reviews_count"""
        stats = self.db.execute(
            select(
                func.count(Review.id),
                func.coalesce(func.avg(Review.rating), 0),
            ).where(Review.vet_id == vet_id)
        ).one()
        count, avg_rating = stats

        vet = self.db.get(Vet, vet_id)
        if vet:
            vet.reviews_count = count
            vet.rating_average = round(float(avg_rating), 2)
            self.db.commit()

    # --- Notifications ---

    def get_notifications_by_owner(self, owner_id: UUID) -> list[Notification]:
        """Get all notifications for an owner, newest first"""
        query = (
            select(Notification)
            .where(Notification.pet_owner_id == owner_id)
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.scalars(query).all())

    def get_notification_by_id(self, notification_id: UUID, owner_id: UUID) -> Notification | None:
        """Get a specific notification ensuring it belongs to the owner"""
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.pet_owner_id == owner_id,
        )
        return self.db.scalar(query)

    def mark_notification_read(self, notification: Notification) -> Notification:
        """Mark a single notification as read"""
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_notifications_read(self, owner_id: UUID) -> int:
        """Mark all unread notifications as read, return count updated"""
        from sqlalchemy import update
        stmt = (
            update(Notification)
            .where(
                Notification.pet_owner_id == owner_id,
                Notification.is_read == False,
            )
            .values(is_read=True)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount

    # --- Owner Profile ---

    def get_owner_by_id(self, owner_id: UUID) -> PetOwner | None:
        """Get an owner by ID"""
        query = select(PetOwner).where(PetOwner.id == owner_id)
        return self.db.scalar(query)

    def update_owner(self, owner: PetOwner, **kwargs) -> PetOwner:
        """Update owner fields"""
        for key, value in kwargs.items():
            if value is not None:
                setattr(owner, key, value)
        self.db.commit()
        self.db.refresh(owner)
        return owner

    # --- Pet CRUD ---

    def create_pet(self, pet_owner_id: UUID, **kwargs) -> Pet:
        """Create a new pet"""
        pet = Pet(pet_owner_id=pet_owner_id, **kwargs)
        self.db.add(pet)
        self.db.commit()
        self.db.refresh(pet)
        return pet

    def update_pet(self, pet: Pet, **kwargs) -> Pet:
        """Update pet fields"""
        for key, value in kwargs.items():
            if value is not None:
                setattr(pet, key, value)
        self.db.commit()
        self.db.refresh(pet)
        return pet

    def delete_pet(self, pet: Pet) -> None:
        """Delete a pet"""
        self.db.delete(pet)
        self.db.commit()
