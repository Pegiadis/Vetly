"""
Database seeding script with test data
Run this after migrations to populate the database with sample data
"""

import sys
import os
from datetime import datetime, date, time, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session as DBSession
from app.db.session import SessionLocal
from app.models.pet_owner import PetOwner
from app.models.vet import Vet
from app.models.pet import Pet, PetType, Gender
from app.models.medical_event import MedicalEvent
from app.models.weight_history import WeightHistory
from app.models.medication import Medication, MedicationFrequency
from app.models.appointment import Appointment, AppointmentStatus
from app.models.review import Review
from app.models.blog_post import BlogPost
from app.models.notification import Notification
from app.core.security import get_password_hash


def clear_database(db: DBSession):
    """Clear all existing data"""
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies
    db.query(Notification).delete()
    db.query(Review).delete()
    db.query(Appointment).delete()
    db.query(Medication).delete()
    db.query(WeightHistory).delete()
    db.query(MedicalEvent).delete()
    db.query(Pet).delete()
    db.query(BlogPost).delete()
    db.query(PetOwner).delete()
    db.query(Vet).delete()
    
    db.commit()
    print("Database cleared!")


def seed_pet_owners(db: DBSession):
    """Create test pet owners"""
    print("Creating pet owners...")

    default_password = get_password_hash("password123")

    pet_owners = [
        PetOwner(
            email="maria.papadopoulos@example.com",
            password_hash=default_password,
            name="Maria Papadopoulos",
            phone="+30 210 123 4567",
            address="Kifisia, Athens",
            email_verified=True
        ),
        PetOwner(
            email="nikos.georgiadis@example.com",
            password_hash=default_password,
            name="Nikos Georgiadis",
            phone="+30 210 987 6543",
            address="Glyfada, Athens",
            email_verified=True
        ),
    ]

    db.add_all(pet_owners)
    db.commit()

    for owner in pet_owners:
        db.refresh(owner)

    print(f"Created {len(pet_owners)} pet owners")
    return pet_owners


def seed_vets(db: DBSession):
    """Create test veterinarians"""
    print("Creating vets...")
    
    default_password = get_password_hash("password123")

    vets = [
        Vet(
            email="dr.antonis.vasilis@vetly.gr",
            password_hash=default_password,
            name="Dr. Antonis Vasilis",
            specialty="General Practice",
            license_number="VET-GR-12345",
            phone="+30 210 555 1234",
            address="Leoforos Kifisias 123, Athens",
            city="Athens",
            coordinates_lat=38.0741,
            coordinates_lng=23.8103,
            hours={
                "monday": {"open": "09:00", "close": "18:00", "closed": False},
                "tuesday": {"open": "09:00", "close": "18:00", "closed": False},
                "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
                "thursday": {"open": "09:00", "close": "18:00", "closed": False},
                "friday": {"open": "09:00", "close": "18:00", "closed": False},
                "saturday": {"open": "10:00", "close": "14:00", "closed": False},
                "sunday": {"closed": True}
            },
            description="Experienced veterinarian with 15 years in general practice. Specialized in preventive care and routine checkups.",
            is_verified=True,
            rating_average=4.8,
            reviews_count=0
        ),
        Vet(
            email="dr.elena.nikolaou@vetly.gr",
            password_hash=default_password,
            name="Dr. Elena Nikolaou",
            specialty="Surgery",
            license_number="VET-GR-67890",
            phone="+30 210 555 5678",
            address="Vouliagmenis Ave 45, Glyfada",
            city="Athens",
            coordinates_lat=37.8651,
            coordinates_lng=23.7542,
            hours={
                "monday": {"open": "10:00", "close": "19:00", "closed": False},
                "tuesday": {"open": "10:00", "close": "19:00", "closed": False},
                "wednesday": {"open": "10:00", "close": "19:00", "closed": False},
                "thursday": {"open": "10:00", "close": "19:00", "closed": False},
                "friday": {"open": "10:00", "close": "19:00", "closed": False},
                "saturday": {"closed": True},
                "sunday": {"closed": True}
            },
            description="Board-certified surgeon specializing in soft tissue and orthopedic procedures.",
            is_on_call=True,
            is_verified=True,
            rating_average=4.9,
            reviews_count=0
        ),
        Vet(
            email="dr.dimitris.papadakis@vetly.gr",
            password_hash=default_password,
            name="Dr. Dimitris Papadakis",
            specialty="Emergency Care",
            license_number="VET-GR-11111",
            phone="+30 210 555 9999",
            address="Patision 200, Athens",
            city="Athens",
            coordinates_lat=38.0157,
            coordinates_lng=23.7353,
            hours={
                "monday": {"open": "00:00", "close": "23:59", "closed": False},
                "tuesday": {"open": "00:00", "close": "23:59", "closed": False},
                "wednesday": {"open": "00:00", "close": "23:59", "closed": False},
                "thursday": {"open": "00:00", "close": "23:59", "closed": False},
                "friday": {"open": "00:00", "close": "23:59", "closed": False},
                "saturday": {"open": "00:00", "close": "23:59", "closed": False},
                "sunday": {"open": "00:00", "close": "23:59", "closed": False}
            },
            description="24/7 emergency veterinary care. Available for urgent cases at any time.",
            is_on_call=True,
            is_verified=True,
            rating_average=4.7,
            reviews_count=0
        ),
    ]
    
    db.add_all(vets)
    db.commit()
    
    for vet in vets:
        db.refresh(vet)
    
    print(f"Created {len(vets)} vets")
    return vets


def seed_pets(db: DBSession, pet_owners):
    """Create test pets"""
    print("Creating pets...")

    pets = [
        # Maria's pets
        Pet(
            pet_owner_id=pet_owners[0].id,
            name="Max",
            type=PetType.DOG,
            breed="Golden Retriever",
            age=5,
            weight=32.5,
            gender=Gender.MALE,
            chip_number="GR-DOG-123456789"
        ),
        Pet(
            pet_owner_id=pet_owners[0].id,
            name="Luna",
            type=PetType.CAT,
            breed="Persian",
            age=3,
            weight=4.2,
            gender=Gender.FEMALE,
            chip_number="GR-CAT-987654321"
        ),
        # Nikos's pets
        Pet(
            pet_owner_id=pet_owners[1].id,
            name="Rocky",
            type=PetType.DOG,
            breed="German Shepherd",
            age=4,
            weight=38.0,
            gender=Gender.MALE,
            chip_number="GR-DOG-111222333"
        ),
        Pet(
            pet_owner_id=pet_owners[1].id,
            name="Bella",
            type=PetType.DOG,
            breed="Beagle",
            age=2,
            weight=12.5,
            gender=Gender.FEMALE,
            chip_number="GR-DOG-444555666"
        ),
        Pet(
            pet_owner_id=pet_owners[1].id,
            name="Whiskers",
            type=PetType.CAT,
            breed="Siamese",
            age=6,
            weight=4.8,
            gender=Gender.MALE
        ),
    ]
    
    db.add_all(pets)
    db.commit()
    
    for pet in pets:
        db.refresh(pet)
    
    print(f"Created {len(pets)} pets")
    return pets


def seed_medical_events(db: DBSession, pets, vets):
    """Create medical history events"""
    print("Creating medical events...")
    
    events = [
        # Max's history
        MedicalEvent(
            pet_id=pets[0].id,
            vet_id=vets[0].id,
            date=date(2024, 1, 15),
            title="Annual Checkup",
            event_type="Checkup",
            notes="Healthy condition. All vaccinations up to date."
        ),
        MedicalEvent(
            pet_id=pets[0].id,
            vet_id=vets[0].id,
            date=date(2023, 6, 20),
            title="Rabies Vaccination",
            event_type="Vaccination",
            notes="Rabies vaccine administered."
        ),
        # Luna's history
        MedicalEvent(
            pet_id=pets[1].id,
            vet_id=vets[0].id,
            date=date(2024, 2, 10),
            title="Dental Cleaning",
            event_type="Dental",
            notes="Routine dental cleaning performed."
        ),
        # Rocky's history
        MedicalEvent(
            pet_id=pets[2].id,
            vet_id=vets[1].id,
            date=date(2023, 11, 5),
            title="Minor Surgery",
            event_type="Surgery",
            notes="Successfully removed small benign growth."
        ),
    ]
    
    db.add_all(events)
    db.commit()
    
    print(f"Created {len(events)} medical events")
    return events


def seed_weight_history(db: DBSession, pets):
    """Create weight tracking history"""
    print("Creating weight history...")
    
    history = []
    
    # Max's weight over 6 months
    base_date = date.today() - timedelta(days=180)
    for i in range(7):
        history.append(WeightHistory(
            pet_id=pets[0].id,
            weight=31.0 + (i * 0.25),
            recorded_at=base_date + timedelta(days=i * 30)
        ))
    
    # Luna's weight over 6 months
    for i in range(7):
        history.append(WeightHistory(
            pet_id=pets[1].id,
            weight=4.0 + (i * 0.03),
            recorded_at=base_date + timedelta(days=i * 30)
        ))
    
    db.add_all(history)
    db.commit()
    
    print(f"Created {len(history)} weight records")
    return history


def seed_medications(db: DBSession, pets):
    """Create medication schedules"""
    print("Creating medications...")
    
    medications = [
        Medication(
            pet_id=pets[0].id,
            name="Heartgard Plus",
            dosage="1 tablet",
            frequency=MedicationFrequency.WEEKLY,
            time=time(9, 0),
            start_date=date(2024, 1, 1),
            notes="Heartworm prevention"
        ),
        Medication(
            pet_id=pets[1].id,
            name="Revolution",
            dosage="1 application",
            frequency=MedicationFrequency.WEEKLY,
            time=time(10, 0),
            start_date=date(2024, 1, 1),
            notes="Flea and tick prevention"
        ),
    ]
    
    db.add_all(medications)
    db.commit()
    
    print(f"Created {len(medications)} medications")
    return medications


def seed_appointments(db: DBSession, pet_owners, vets, pets):
    """Create test appointments"""
    print("Creating appointments...")
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    appointments = [
        # Upcoming appointment
        Appointment(
            vet_id=vets[0].id,
            pet_owner_id=pet_owners[0].id,
            pet_id=pets[0].id,
            scheduled_at=today + timedelta(days=7, hours=10),
            duration_minutes=30,
            type="Checkup",
            status=AppointmentStatus.CONFIRMED,
            notes="Annual checkup"
        ),
        # Today's appointment
        Appointment(
            vet_id=vets[1].id,
            pet_owner_id=pet_owners[1].id,
            pet_id=pets[2].id,
            scheduled_at=today + timedelta(hours=14),
            duration_minutes=45,
            type="Follow-up",
            status=AppointmentStatus.CONFIRMED,
            notes="Post-surgery checkup"
        ),
        # Pending appointment
        Appointment(
            vet_id=vets[0].id,
            pet_owner_id=pet_owners[1].id,
            pet_id=pets[4].id,
            scheduled_at=today + timedelta(days=3, hours=11, minutes=30),
            duration_minutes=30,
            type="Vaccination",
            status=AppointmentStatus.PENDING,
            notes="Needs annual vaccinations"
        ),
    ]
    
    db.add_all(appointments)
    db.commit()
    
    print(f"Created {len(appointments)} appointments")
    return appointments


def seed_reviews(db: DBSession, pet_owners, vets):
    """Create vet reviews"""
    print("Creating reviews...")
    
    reviews = [
        Review(
            vet_id=vets[0].id,
            pet_owner_id=pet_owners[0].id,
            rating=5,
            comment="Dr. Vasilis is amazing! Very caring and knowledgeable. Max always feels comfortable here.",
        ),
        Review(
            vet_id=vets[1].id,
            pet_owner_id=pet_owners[1].id,
            rating=5,
            comment="Excellent surgeon. Dr. Nikolaou performed a complex procedure on Rocky and he recovered perfectly. Highly recommend!",
            reply="Thank you for your kind words! I'm glad Rocky is doing well."
        ),
        Review(
            vet_id=vets[0].id,
            pet_owner_id=pet_owners[1].id,
            rating=4,
            comment="Good service, friendly staff. Wait times can be a bit long during busy hours."
        ),
    ]
    
    db.add_all(reviews)
    db.commit()
    
    # Update vet ratings
    for vet in vets:
        vet_reviews = db.query(Review).filter(Review.vet_id == vet.id).all()
        if vet_reviews:
            vet.reviews_count = len(vet_reviews)
            vet.rating_average = sum(r.rating for r in vet_reviews) / len(vet_reviews)
    
    db.commit()
    
    print(f"Created {len(reviews)} reviews")
    return reviews


def seed_blog_posts(db: DBSession):
    """Create blog posts"""
    print("Creating blog posts...")
    
    posts = [
        BlogPost(
            title="Essential Tips for First-Time Dog Owners",
            excerpt="Bringing home a new dog is exciting! Here are the essential things you need to know.",
            content="# Essential Tips for First-Time Dog Owners\n\nBringing home your first dog is an exciting experience...",
            author="Dr. Antonis Vasilis",
            category="Pet Care",
            read_time="5 min read",
            published_at=datetime(2024, 1, 15, 10, 0)
        ),
        BlogPost(
            title="Understanding Your Cat's Body Language",
            excerpt="Cats communicate through subtle body language. Learn to read the signs.",
            content="# Understanding Your Cat's Body Language\n\nCats are mysterious creatures...",
            author="Dr. Elena Nikolaou",
            category="Pet Behavior",
            read_time="4 min read",
            published_at=datetime(2024, 1, 20, 14, 30)
        ),
        BlogPost(
            title="The Importance of Regular Veterinary Checkups",
            excerpt="Prevention is better than cure. Here's why regular vet visits matter.",
            content="# The Importance of Regular Veterinary Checkups\n\nRegular veterinary checkups...",
            author="Dr. Dimitris Papadakis",
            category="Health",
            read_time="6 min read",
            published_at=datetime(2024, 1, 25, 9, 0)
        ),
    ]
    
    db.add_all(posts)
    db.commit()
    
    print(f"Created {len(posts)} blog posts")
    return posts


def seed_notifications(db: DBSession, pet_owners, vets):
    """Create sample notifications"""
    print("Creating notifications...")
    
    notifications = [
        Notification(
            pet_owner_id=pet_owners[0].id,
            type="appointment",
            title="Upcoming Appointment",
            message="You have an appointment with Dr. Vasilis next week.",
            is_read=False
        ),
        Notification(
            pet_owner_id=pet_owners[1].id,
            type="medication",
            title="Medication Reminder",
            message="Time to give Whiskers their medication.",
            is_read=False
        ),
        Notification(
            vet_id=vets[0].id,
            type="appointment",
            title="New Appointment Request",
            message="New appointment request from Nikos Georgiadis.",
            is_read=False
        ),
    ]
    
    db.add_all(notifications)
    db.commit()
    
    print(f"Created {len(notifications)} notifications")
    return notifications


def main():
    """Main seeding function"""
    print("=" * 50)
    print("Starting database seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        clear_database(db)
        
        # Seed data in order
        pet_owners = seed_pet_owners(db)
        vets = seed_vets(db)
        pets = seed_pets(db, pet_owners)
        seed_medical_events(db, pets, vets)
        seed_weight_history(db, pets)
        seed_medications(db, pets)
        seed_appointments(db, pet_owners, vets, pets)
        seed_reviews(db, pet_owners, vets)
        seed_blog_posts(db)
        seed_notifications(db, pet_owners, vets)
        
        print("=" * 50)
        print("Database seeding completed successfully!")
        print("=" * 50)
        print("\nTest Data Created:")
        print("\nPet Owners (password: password123):")
        print("  - maria.papadopoulos@example.com")
        print("  - nikos.georgiadis@example.com")
        print("\nVets (password: password123):")
        print("  - dr.antonis.vasilis@vetly.gr")
        print("  - dr.elena.nikolaou@vetly.gr")
        print("  - dr.dimitris.papadakis@vetly.gr")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
