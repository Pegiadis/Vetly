"""
Tests for reviews, data isolation, and pet management.

Covers:
- Review CRUD (create, update, delete)
- Review validation (ratings, duplicate prevention, completed-appointment guard)
- Vet reply to review (add, edit, delete)
- Data isolation between owners and between vets
- Pet management (create, validate, soft-delete)
"""

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.db.base import PetOwner, Vet, Pet, Appointment, Review
from app.models.appointment import AppointmentStatus
from app.models.pet import PetType, Gender
from app.core.security import get_password_hash
from app.services.owner import OwnerService
from app.services.appointment import AppointmentService
from app.services.review import ReviewService
from app.schemas.owner import OwnerReviewCreateRequest, OwnerReviewUpdateRequest, PetCreateRequest
from app.schemas.review import ReviewReplyRequest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_owner(db, email="owner@test.com", name="Test Owner"):
    owner = PetOwner(
        email=email,
        password_hash=get_password_hash("test123456"),
        name=name,
        phone="6900000000",
        address="Athens 123",
        email_verified=True,
    )
    db.add(owner)
    db.flush()
    return owner


def _make_vet(db, email="vet@test.com", name="Dr Test Vet", license_number="VET-12345"):
    vet = Vet(
        email=email,
        password_hash=get_password_hash("test123456"),
        name=name,
        slug=name.lower().replace(" ", "-"),
        specialty="General Practice",
        license_number=license_number,
        phone="6900000001",
        address="Athens 456",
        city="Athens",
        is_verified=True,
        is_on_call=False,
        email_verified=True,
    )
    db.add(vet)
    db.flush()
    return vet


def _make_pet(db, owner, name="Buddy", pet_type=PetType.DOG):
    pet = Pet(
        pet_owner_id=owner.id,
        name=name,
        type=pet_type,
        breed="Labrador",
        age=3,
        weight=25.0,
        gender=Gender.MALE,
    )
    db.add(pet)
    db.flush()
    return pet


def _make_completed_appointment(db, owner, vet, pet):
    """Create an appointment that has already been completed."""
    appointment = Appointment(
        pet_owner_id=owner.id,
        vet_id=vet.id,
        pet_id=pet.id,
        scheduled_at=datetime.utcnow() - timedelta(days=7),
        type="Checkup",
        duration_minutes=30,
        status=AppointmentStatus.COMPLETED,
    )
    db.add(appointment)
    db.flush()
    return appointment


def _setup_reviewable(db):
    """
    Full setup: owner + vet + pet + completed appointment.
    Returns (owner, vet, pet, appointment).
    """
    owner = _make_owner(db)
    vet = _make_vet(db)
    pet = _make_pet(db, owner)
    appointment = _make_completed_appointment(db, owner, vet, pet)
    db.commit()
    return owner, vet, pet, appointment


# ===================================================================
# Reviews
# ===================================================================

class TestCreateReview:
    def test_create_review_success(self, db):
        owner, vet, pet, appointment = _setup_reviewable(db)
        service = OwnerService(db)

        data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=5, comment="Excellent vet!", appointment_id=appointment.id
        )
        review = service.create_review(owner.id, data)

        assert review.rating == 5
        assert review.comment == "Excellent vet!"
        assert review.vet_id == vet.id
        assert review.pet_owner_id == owner.id

    def test_create_review_without_completed_appointment_rejected(self, db):
        owner = _make_owner(db)
        vet = _make_vet(db)
        pet = _make_pet(db, owner)
        # Create a PENDING appointment (not completed)
        appointment = Appointment(
            pet_owner_id=owner.id,
            vet_id=vet.id,
            pet_id=pet.id,
            scheduled_at=datetime.utcnow() + timedelta(days=7),
            type="Checkup",
            duration_minutes=30,
            status=AppointmentStatus.PENDING,
        )
        db.add(appointment)
        db.commit()

        service = OwnerService(db)
        data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=4, comment="Good", appointment_id=appointment.id
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_review(owner.id, data)
        assert exc_info.value.status_code == 403

    def test_create_duplicate_review_rejected(self, db):
        owner, vet, pet, appointment = _setup_reviewable(db)
        service = OwnerService(db)

        data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=5, comment="Great!", appointment_id=appointment.id
        )
        service.create_review(owner.id, data)

        # Try to create a second review for the same vet
        data2 = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=3, comment="Changed my mind"
        )
        with pytest.raises(HTTPException) as exc_info:
            service.create_review(owner.id, data2)
        assert exc_info.value.status_code == 409

    def test_invalid_rating_rejected(self, db):
        """Ratings outside 1-5 should be rejected by schema validation."""
        with pytest.raises(Exception):
            OwnerReviewCreateRequest(vet_id="00000000-0000-0000-0000-000000000001", rating=0, comment="Bad")

        with pytest.raises(Exception):
            OwnerReviewCreateRequest(vet_id="00000000-0000-0000-0000-000000000001", rating=6, comment="Too much")


class TestUpdateReview:
    def test_update_review_success(self, db):
        owner, vet, pet, appointment = _setup_reviewable(db)
        service = OwnerService(db)

        create_data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=4, comment="Good vet"
        )
        review = service.create_review(owner.id, create_data)

        update_data = OwnerReviewUpdateRequest(rating=5, comment="Actually great vet!")
        updated = service.update_review(owner.id, review.id, update_data)

        assert updated.rating == 5
        assert updated.comment == "Actually great vet!"


class TestDeleteReview:
    def test_delete_review_success(self, db):
        owner, vet, pet, appointment = _setup_reviewable(db)
        service = OwnerService(db)

        create_data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=3, comment="OK vet"
        )
        review = service.create_review(owner.id, create_data)

        service.delete_review(owner.id, review.id)

        # Verify deletion
        from sqlalchemy import select
        result = db.scalar(select(Review).where(Review.id == review.id))
        assert result is None


# ===================================================================
# Vet Reply to Review
# ===================================================================

class TestVetReply:
    def _setup_review(self, db):
        """Create an owner review that a vet can reply to."""
        owner, vet, pet, appointment = _setup_reviewable(db)
        owner_service = OwnerService(db)
        data = OwnerReviewCreateRequest(
            vet_id=vet.id, rating=4, comment="Good experience"
        )
        review = owner_service.create_review(owner.id, data)
        return owner, vet, review

    def test_vet_reply_to_review(self, db):
        owner, vet, review = self._setup_review(db)
        service = ReviewService(db)
        data = ReviewReplyRequest(reply="Thank you for your kind words!")

        result = service.reply_to_review(review.id, vet.id, data)

        assert result.reply == "Thank you for your kind words!"

    def test_vet_edit_reply(self, db):
        owner, vet, review = self._setup_review(db)
        service = ReviewService(db)

        # First add a reply
        service.reply_to_review(review.id, vet.id, ReviewReplyRequest(reply="Thanks!"))

        # Then edit it
        result = service.update_reply(
            review.id, vet.id, ReviewReplyRequest(reply="Thank you very much!")
        )

        assert result.reply == "Thank you very much!"

    def test_vet_delete_reply(self, db):
        owner, vet, review = self._setup_review(db)
        service = ReviewService(db)

        # First add a reply
        service.reply_to_review(review.id, vet.id, ReviewReplyRequest(reply="Thanks!"))

        # Then delete it
        result = service.delete_reply(review.id, vet.id)

        assert result.reply is None


# ===================================================================
# Data Isolation
# ===================================================================

class TestDataIsolation:
    def test_owner_cannot_see_other_owners_pets(self, db):
        owner1 = _make_owner(db, email="owner1@test.com", name="Owner 1")
        owner2 = _make_owner(db, email="owner2@test.com", name="Owner 2")
        _make_pet(db, owner1, name="Dog1")
        _make_pet(db, owner2, name="Dog2")
        db.commit()

        service = OwnerService(db)
        result = service.get_my_pets(owner1.id)

        assert result.total == 1
        assert result.items[0].name == "Dog1"

    def test_owner_cannot_see_other_owners_appointments(self, db):
        owner1 = _make_owner(db, email="owner1@test.com", name="Owner 1")
        owner2 = _make_owner(db, email="owner2@test.com", name="Owner 2")
        vet = _make_vet(db)
        pet1 = _make_pet(db, owner1, name="Dog1")
        pet2 = _make_pet(db, owner2, name="Dog2")

        apt1 = Appointment(
            pet_owner_id=owner1.id, vet_id=vet.id, pet_id=pet1.id,
            scheduled_at=datetime.utcnow() + timedelta(days=1),
            type="Checkup", duration_minutes=30, status=AppointmentStatus.PENDING,
        )
        apt2 = Appointment(
            pet_owner_id=owner2.id, vet_id=vet.id, pet_id=pet2.id,
            scheduled_at=datetime.utcnow() + timedelta(days=2),
            type="Checkup", duration_minutes=30, status=AppointmentStatus.PENDING,
        )
        db.add_all([apt1, apt2])
        db.commit()

        service = OwnerService(db)
        result = service.get_my_appointments(owner1.id)

        assert result.total == 1
        assert all(item.pet_owner_id == owner1.id for item in result.items)

    def test_owner_cannot_cancel_other_owners_appointment(self, db):
        owner1 = _make_owner(db, email="owner1@test.com", name="Owner 1")
        owner2 = _make_owner(db, email="owner2@test.com", name="Owner 2")
        vet = _make_vet(db)
        pet2 = _make_pet(db, owner2, name="Dog2")

        apt = Appointment(
            pet_owner_id=owner2.id, vet_id=vet.id, pet_id=pet2.id,
            scheduled_at=datetime.utcnow() + timedelta(days=7),
            type="Checkup", duration_minutes=30, status=AppointmentStatus.PENDING,
        )
        db.add(apt)
        db.commit()

        service = OwnerService(db)
        with pytest.raises(HTTPException) as exc_info:
            service.cancel_appointment(owner1.id, apt.id)
        assert exc_info.value.status_code == 404

    def test_vet_cannot_approve_other_vets_appointment(self, db):
        owner = _make_owner(db)
        vet1 = _make_vet(db, email="vet1@test.com", name="Dr Vet1", license_number="VET-001")
        vet2 = _make_vet(db, email="vet2@test.com", name="Dr Vet2", license_number="VET-002")
        pet = _make_pet(db, owner)

        apt = Appointment(
            pet_owner_id=owner.id, vet_id=vet1.id, pet_id=pet.id,
            scheduled_at=datetime.utcnow() + timedelta(days=3),
            type="Checkup", duration_minutes=30, status=AppointmentStatus.PENDING,
        )
        db.add(apt)
        db.commit()

        service = AppointmentService(db)
        with pytest.raises(HTTPException) as exc_info:
            service.approve_appointment(apt.id, vet2.id)
        assert exc_info.value.status_code == 404

    def test_owner_cannot_delete_other_owners_review(self, db):
        # Owner 1 creates a review
        owner1 = _make_owner(db, email="owner1@test.com", name="Owner 1")
        owner2 = _make_owner(db, email="owner2@test.com", name="Owner 2")
        vet = _make_vet(db)
        pet1 = _make_pet(db, owner1, name="Dog1")
        _make_completed_appointment(db, owner1, vet, pet1)
        db.commit()

        service = OwnerService(db)
        data = OwnerReviewCreateRequest(vet_id=vet.id, rating=5, comment="Great!")
        review = service.create_review(owner1.id, data)

        # Owner 2 tries to delete it
        with pytest.raises(HTTPException) as exc_info:
            service.delete_review(owner2.id, review.id)
        assert exc_info.value.status_code == 404


# ===================================================================
# Pet Management
# ===================================================================

class TestPetManagement:
    def test_create_pet_success(self, db):
        owner = _make_owner(db)
        db.commit()

        service = OwnerService(db)
        data = PetCreateRequest(
            name="Buddy", type="Dog", breed="Golden Retriever",
            age=2, weight=30.0, gender="Male",
        )
        pet = service.create_pet(owner.id, data)

        assert pet.name == "Buddy"
        assert pet.type == "Dog"
        assert pet.breed == "Golden Retriever"
        assert pet.age == 2
        assert pet.weight == 30.0

    def test_create_pet_invalid_data(self, db):
        """Negative age and zero weight should be rejected by schema validation."""
        # age has ge=0 so negative fails; weight has gt=0 so zero fails
        with pytest.raises(Exception):
            PetCreateRequest(
                name="Bad", type="Dog", breed="Lab",
                age=-1, weight=10.0, gender="Male",
            )

        with pytest.raises(Exception):
            PetCreateRequest(
                name="Bad", type="Dog", breed="Lab",
                age=2, weight=0, gender="Male",
            )

    def test_create_pet_new_types(self, db):
        """Bird, Rabbit, and other non-standard pet types should be accepted."""
        owner = _make_owner(db)
        db.commit()
        service = OwnerService(db)

        for pet_type in ["Bird", "Rabbit", "Hamster", "Reptile"]:
            data = PetCreateRequest(
                name=f"My {pet_type}", type=pet_type, breed="Unknown",
                age=1, weight=1.0, gender="Male",
            )
            pet = service.create_pet(owner.id, data)
            assert pet.type == pet_type

    def test_soft_delete_pet(self, db):
        owner = _make_owner(db)
        pet = _make_pet(db, owner, name="ToDelete")
        db.commit()

        service = OwnerService(db)
        service.delete_pet(owner.id, pet.id)

        # Pet should no longer appear in the regular list
        result = service.get_my_pets(owner.id)
        assert result.total == 0

        # But it should appear in deleted pets
        deleted = service.get_deleted_pets(owner.id)
        assert len(deleted) == 1
        assert deleted[0].name == "ToDelete"

    def test_deleted_pet_not_in_list(self, db):
        owner = _make_owner(db)
        _make_pet(db, owner, name="Alive")
        dead_pet = _make_pet(db, owner, name="Deleted")
        db.commit()

        service = OwnerService(db)
        service.delete_pet(owner.id, dead_pet.id)

        result = service.get_my_pets(owner.id)
        assert result.total == 1
        names = [item.name for item in result.items]
        assert "Alive" in names
        assert "Deleted" not in names
