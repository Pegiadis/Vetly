"""
Repository for pet owner related database operations
"""

from uuid import UUID
from datetime import datetime, date, timedelta

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.db.base import Pet, Appointment, Vet, PetOwner, MedicalEvent, Medication, Review, Notification
from app.models.appointment import AppointmentStatus


class OwnerRepository:
    """Repository for pet owner database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_pets_by_owner_id(
        self, owner_id: UUID, skip: int = 0, limit: int | None = None
    ) -> tuple[list[Pet], int]:
        """Get non-deleted pets for a pet owner with pagination"""
        base = and_(Pet.pet_owner_id == owner_id, Pet.deleted_at == None)
        query = select(Pet).where(base).order_by(Pet.name)
        if limit is not None:
            query = query.offset(skip).limit(limit)
        pets = list(self.db.scalars(query).all())
        total = self.db.scalar(select(func.count(Pet.id)).where(base)) or 0
        return pets, total

    def get_pet_by_id(self, pet_id: UUID, owner_id: UUID) -> Pet | None:
        """Get a specific non-deleted pet by ID, ensuring it belongs to the owner"""
        query = select(Pet).where(
            Pet.id == pet_id,
            Pet.pet_owner_id == owner_id,
            Pet.deleted_at == None,
        )
        return self.db.scalar(query)

    def get_appointments_by_owner_id(
        self,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 10,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        pet_name: str | None = None,
    ) -> tuple[list[Appointment], int]:
        """Get appointments for a pet owner with pagination and filters"""
        conditions = [Appointment.pet_owner_id == owner_id]

        if status == "upcoming":
            conditions.append(Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]))
        elif status == "past":
            conditions.append(Appointment.status.in_([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]))

        if date_from:
            conditions.append(Appointment.scheduled_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            conditions.append(Appointment.scheduled_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))
        if pet_name:
            conditions.append(Appointment.pet.has(Pet.name.ilike(f"%{pet_name}%")))

        where = and_(*conditions)

        query = (
            select(Appointment)
            .options(joinedload(Appointment.pet), joinedload(Appointment.vet))
            .where(where)
            .order_by(Appointment.scheduled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).unique().all())

        count_query = select(func.count(Appointment.id)).where(where)
        total = self.db.scalar(count_query) or 0
        return items, total

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

    def get_appointment_by_id(self, appointment_id: UUID, owner_id: UUID) -> Appointment | None:
        """Get a specific appointment ensuring it belongs to the owner"""
        query = (
            select(Appointment)
            .options(joinedload(Appointment.pet), joinedload(Appointment.vet))
            .where(
                Appointment.id == appointment_id,
                Appointment.pet_owner_id == owner_id,
            )
        )
        return self.db.scalar(query)

    def cancel_appointment(self, appointment: Appointment) -> Appointment:
        """Cancel an appointment"""
        appointment.status = AppointmentStatus.CANCELLED
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def reschedule_appointment(self, appointment: Appointment, new_scheduled_at: datetime) -> Appointment:
        """Reschedule an appointment to a new time, reset to pending"""
        appointment.scheduled_at = new_scheduled_at
        appointment.status = AppointmentStatus.PENDING
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def has_conflicting_appointment(
        self, vet_id: UUID, scheduled_at: datetime, duration_minutes: int
    ) -> bool:
        """Check if a vet already has an active appointment overlapping the given slot"""
        slot_start = scheduled_at
        slot_end = scheduled_at + timedelta(minutes=duration_minutes)
        day_start = scheduled_at.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        query = (
            select(Appointment)
            .where(
                and_(
                    Appointment.vet_id == vet_id,
                    Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
                    Appointment.scheduled_at >= day_start,
                    Appointment.scheduled_at < day_end,
                )
            )
        )
        existing = self.db.scalars(query).all()
        for apt in existing:
            apt_start = apt.scheduled_at
            apt_end = apt_start + timedelta(minutes=apt.duration_minutes)
            if slot_start < apt_end and slot_end > apt_start:
                return True
        return False

    def has_same_day_appointment(
        self, pet_id: UUID, vet_id: UUID, scheduled_at: datetime
    ) -> bool:
        """Check if the same pet already has an active appointment with the same vet on the same day"""
        day_start = scheduled_at.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        query = select(Appointment.id).where(
            Appointment.pet_id == pet_id,
            Appointment.vet_id == vet_id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            Appointment.scheduled_at >= day_start,
            Appointment.scheduled_at < day_end,
        ).limit(1)
        return self.db.scalar(query) is not None

    def create_appointment(
        self,
        pet_owner_id: UUID,
        vet_id: UUID,
        pet_id: UUID,
        scheduled_at: datetime,
        appointment_type: str,
        duration_minutes: int,
        notes: str | None = None,
        service_type_id: UUID | None = None,
        group_id: UUID | None = None,
        auto_commit: bool = True,
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
            service_type_id=service_type_id,
            group_id=group_id,
            status=AppointmentStatus.PENDING,
        )
        self.db.add(appointment)
        if auto_commit:
            self.db.commit()
            self.db.refresh(appointment)
        else:
            self.db.flush()
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
        """Get all non-deleted pet IDs belonging to an owner"""
        query = select(Pet.id).where(
            Pet.pet_owner_id == owner_id,
            Pet.deleted_at == None,
        )
        return list(self.db.scalars(query).all())

    def get_medical_history_for_pet(
        self, pet_id: UUID, skip: int = 0, limit: int = 10, event_type: str | None = None
    ) -> tuple[list[MedicalEvent], int]:
        """Get medical history for a pet with vet details"""
        conditions = [MedicalEvent.pet_id == pet_id]
        if event_type:
            conditions.append(MedicalEvent.event_type == event_type)
        where = and_(*conditions)

        query = (
            select(MedicalEvent)
            .options(joinedload(MedicalEvent.vet))
            .where(where)
            .order_by(MedicalEvent.date.desc())
            .offset(skip)
            .limit(limit)
        )
        events = self.db.scalars(query).unique().all()
        total = self.db.scalar(select(func.count(MedicalEvent.id)).where(where)) or 0
        return list(events), total

    def get_medications_for_owner(
        self, owner_id: UUID, is_active: bool | None = None, skip: int = 0, limit: int = 10
    ) -> tuple[list[Medication], int]:
        """Get medications for an owner's pets with pagination"""
        pet_ids = self.get_pet_ids_for_owner(owner_id)
        if not pet_ids:
            return [], 0

        conditions = [Medication.pet_id.in_(pet_ids)]
        if is_active is not None:
            conditions.append(Medication.is_active == is_active)
        where = and_(*conditions)

        query = (
            select(Medication)
            .options(joinedload(Medication.pet))
            .where(where)
            .order_by(Medication.is_active.desc(), Medication.name)
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).unique().all())
        total = self.db.scalar(select(func.count(Medication.id)).where(where)) or 0
        return items, total

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

    def get_reviews_by_owner(
        self, owner_id: UUID, skip: int = 0, limit: int = 10
    ) -> tuple[list[Review], int]:
        """Get reviews by an owner with pagination"""
        where = Review.pet_owner_id == owner_id
        query = (
            select(Review)
            .options(joinedload(Review.vet))
            .where(where)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).unique().all())
        total = self.db.scalar(select(func.count(Review.id)).where(where)) or 0
        return items, total

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

    # --- Review helpers ---

    def has_completed_appointment_with_vet(self, owner_id: UUID, vet_id: UUID) -> bool:
        """Check if the owner has at least one COMPLETED appointment with the given vet"""
        query = select(Appointment.id).where(
            Appointment.pet_owner_id == owner_id,
            Appointment.vet_id == vet_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        ).limit(1)
        return self.db.scalar(query) is not None

    def get_reviewable_vets(self, owner_id: UUID) -> list[Vet]:
        """Get vets with whom the owner has completed at least one appointment"""
        vet_ids_subq = (
            select(Appointment.vet_id)
            .where(
                Appointment.pet_owner_id == owner_id,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
            .distinct()
            .subquery()
        )
        query = select(Vet).where(Vet.id.in_(select(vet_ids_subq))).order_by(Vet.name)
        return list(self.db.scalars(query).all())

    # --- Notifications ---

    def get_notifications_by_owner(
        self, owner_id: UUID, skip: int = 0, limit: int = 10
    ) -> tuple[list[Notification], int]:
        """Get notifications for an owner with pagination"""
        where = Notification.pet_owner_id == owner_id
        query = (
            select(Notification)
            .where(where)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())
        total = self.db.scalar(select(func.count(Notification.id)).where(where)) or 0
        return items, total

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

    def get_pet_by_chip_number(self, chip_number: str, exclude_pet_id: UUID | None = None) -> Pet | None:
        """Look up a non-deleted pet by chip number, optionally excluding a specific pet"""
        query = select(Pet).where(Pet.chip_number == chip_number, Pet.deleted_at == None)
        if exclude_pet_id is not None:
            query = query.where(Pet.id != exclude_pet_id)
        return self.db.scalar(query)

    def get_deleted_pets_by_owner_id(self, owner_id: UUID) -> list[Pet]:
        """Get all soft-deleted pets for a pet owner"""
        query = select(Pet).where(
            Pet.pet_owner_id == owner_id,
            Pet.deleted_at != None,
        ).order_by(Pet.deleted_at.desc())
        return list(self.db.scalars(query).all())

    def get_deleted_pet_by_id(self, pet_id: UUID, owner_id: UUID) -> Pet | None:
        """Get a specific soft-deleted pet by ID, ensuring it belongs to the owner"""
        query = select(Pet).where(
            Pet.id == pet_id,
            Pet.pet_owner_id == owner_id,
            Pet.deleted_at != None,
        )
        return self.db.scalar(query)

    def delete_pet(self, pet: Pet) -> None:
        """Soft-delete a pet by setting deleted_at timestamp"""
        pet.deleted_at = datetime.utcnow()
        self.db.commit()

    def restore_pet(self, pet: Pet) -> Pet:
        """Restore a soft-deleted pet"""
        pet.deleted_at = None
        self.db.commit()
        self.db.refresh(pet)
        return pet
