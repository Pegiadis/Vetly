"""
Database seeding script for development and testing
"""

import random
from datetime import datetime, timedelta, date
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.base import Vet, User, Pet, Appointment, Review, MedicalEvent
from app.models.pet import PetType, Gender
from app.models.appointment import AppointmentStatus
from app.core.security import get_password_hash


# Sample data
VET_DATA = [
    {
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@vetly.com",
        "specialty": "General Practice",
        "license_number": "VET-001-2024",
        "phone": "+1 (555) 123-4567",
        "address": "123 Pet Care Lane",
        "city": "San Francisco",
        "description": "Experienced general practitioner with 10 years of experience in small animal care.",
        "is_verified": True,
    },
    {
        "name": "Dr. Michael Chen",
        "email": "michael.chen@vetly.com",
        "specialty": "Surgery",
        "license_number": "VET-002-2024",
        "phone": "+1 (555) 234-5678",
        "address": "456 Medical Center Dr",
        "city": "San Francisco",
        "description": "Board-certified veterinary surgeon specializing in orthopedic procedures.",
        "is_verified": True,
    },
    {
        "name": "Dr. Emily Rodriguez",
        "email": "emily.rodriguez@vetly.com",
        "specialty": "Dermatology",
        "license_number": "VET-003-2024",
        "phone": "+1 (555) 345-6789",
        "address": "789 Animal Health Blvd",
        "city": "Oakland",
        "description": "Specialist in veterinary dermatology and allergy treatment.",
        "is_verified": True,
    },
    {
        "name": "Dr. James Wilson",
        "email": "james.wilson@vetly.com",
        "specialty": "Emergency Care",
        "license_number": "VET-004-2024",
        "phone": "+1 (555) 456-7890",
        "address": "321 Emergency Pet Rd",
        "city": "San Jose",
        "description": "24/7 emergency veterinary care specialist.",
        "is_verified": True,
        "is_on_call": True,
    },
    {
        "name": "Dr. Lisa Park",
        "email": "lisa.park@vetly.com",
        "specialty": "Dentistry",
        "license_number": "VET-005-2024",
        "phone": "+1 (555) 567-8901",
        "address": "555 Dental Care Ave",
        "city": "Palo Alto",
        "description": "Veterinary dental specialist with advanced training in oral surgery.",
        "is_verified": False,
    },
]

USER_DATA = [
    {"name": "John Smith", "email": "john.smith@example.com", "phone": "+1 (555) 111-1111"},
    {"name": "Emma Davis", "email": "emma.davis@example.com", "phone": "+1 (555) 222-2222"},
    {"name": "Robert Brown", "email": "robert.brown@example.com", "phone": "+1 (555) 333-3333"},
    {"name": "Jennifer Miller", "email": "jennifer.miller@example.com", "phone": "+1 (555) 444-4444"},
    {"name": "David Wilson", "email": "david.wilson@example.com", "phone": "+1 (555) 555-5555"},
    {"name": "Sarah Taylor", "email": "sarah.taylor@example.com", "phone": "+1 (555) 666-6666"},
    {"name": "Michael Anderson", "email": "michael.anderson@example.com", "phone": "+1 (555) 777-7777"},
    {"name": "Lisa Thomas", "email": "lisa.thomas@example.com", "phone": "+1 (555) 888-8888"},
    {"name": "James Jackson", "email": "james.jackson@example.com", "phone": "+1 (555) 999-9999"},
    {"name": "Amanda White", "email": "amanda.white@example.com", "phone": "+1 (555) 000-0000"},
    {"name": "Christopher Harris", "email": "chris.harris@example.com", "phone": "+1 (555) 121-2121"},
    {"name": "Jessica Martin", "email": "jessica.martin@example.com", "phone": "+1 (555) 131-3131"},
]

PET_NAMES = [
    ("Max", PetType.DOG, "Golden Retriever", Gender.MALE),
    ("Bella", PetType.DOG, "Labrador", Gender.FEMALE),
    ("Charlie", PetType.DOG, "Beagle", Gender.MALE),
    ("Luna", PetType.CAT, "Persian", Gender.FEMALE),
    ("Oliver", PetType.CAT, "Siamese", Gender.MALE),
    ("Whiskers", PetType.CAT, "Maine Coon", Gender.MALE),
    ("Buddy", PetType.DOG, "German Shepherd", Gender.MALE),
    ("Daisy", PetType.DOG, "Poodle", Gender.FEMALE),
    ("Milo", PetType.CAT, "British Shorthair", Gender.MALE),
    ("Cleo", PetType.CAT, "Ragdoll", Gender.FEMALE),
    ("Rocky", PetType.DOG, "Bulldog", Gender.MALE),
    ("Sophie", PetType.DOG, "Cocker Spaniel", Gender.FEMALE),
    ("Leo", PetType.CAT, "Bengal", Gender.MALE),
    ("Nala", PetType.CAT, "Abyssinian", Gender.FEMALE),
    ("Cooper", PetType.DOG, "Australian Shepherd", Gender.MALE),
    ("Sadie", PetType.DOG, "Border Collie", Gender.FEMALE),
    ("Simba", PetType.CAT, "Orange Tabby", Gender.MALE),
    ("Molly", PetType.DOG, "Shih Tzu", Gender.FEMALE),
    ("Oscar", PetType.CAT, "Scottish Fold", Gender.MALE),
    ("Coco", PetType.DOG, "French Bulldog", Gender.FEMALE),
    ("Ginger", PetType.OTHER, "Rabbit", Gender.FEMALE),
    ("Tweety", PetType.OTHER, "Parakeet", Gender.MALE),
    ("Hammy", PetType.OTHER, "Hamster", Gender.MALE),
    ("Shelly", PetType.OTHER, "Turtle", Gender.FEMALE),
    ("Spike", PetType.OTHER, "Hedgehog", Gender.MALE),
]

APPOINTMENT_TYPES = ["Checkup", "Vaccination", "Surgery", "Dental Cleaning", "Emergency", "Follow-up", "Grooming", "X-Ray"]

REVIEW_COMMENTS = [
    "Excellent care for my pet! Highly recommend.",
    "Dr. was very thorough and explained everything clearly.",
    "Great experience. Staff was friendly and professional.",
    "My pet was nervous but they made him feel comfortable.",
    "Quick appointment and reasonable prices.",
    "Very knowledgeable about exotic pets.",
    "The clinic is clean and well-equipped.",
    "Helped my pet recover quickly after surgery.",
    "Always available for emergencies.",
    "Best vet in the area!",
    "Good service but had to wait a bit.",
    "Professional and caring team.",
    "My pet loves coming here!",
    "Detailed follow-up instructions provided.",
    "Fair pricing for quality care.",
]

MEDICAL_EVENT_TYPES = ["Vaccination", "Surgery", "Checkup", "Dental", "Emergency", "Lab Test", "X-Ray", "Medication"]


def create_working_hours():
    """Generate sample working hours"""
    return {
        "monday": {"open": "09:00", "close": "18:00", "closed": False},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": False},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
        "thursday": {"open": "09:00", "close": "18:00", "closed": False},
        "friday": {"open": "09:00", "close": "17:00", "closed": False},
        "saturday": {"open": "10:00", "close": "14:00", "closed": False},
        "sunday": {"open": None, "close": None, "closed": True},
    }


def seed_vets(db: Session) -> list[Vet]:
    """Seed veterinarians"""
    vets = []
    default_password = get_password_hash("password123")

    for data in VET_DATA:
        vet = Vet(
            id=uuid4(),
            email=data["email"],
            password_hash=default_password,
            name=data["name"],
            specialty=data["specialty"],
            license_number=data["license_number"],
            phone=data["phone"],
            address=data["address"],
            city=data["city"],
            description=data.get("description"),
            hours=create_working_hours(),
            is_verified=data.get("is_verified", False),
            is_on_call=data.get("is_on_call", False),
            rating_average=0,
            reviews_count=0,
        )
        db.add(vet)
        vets.append(vet)

    db.commit()
    return vets


def seed_users(db: Session) -> list[User]:
    """Seed users (pet owners)"""
    users = []

    for data in USER_DATA:
        user = User(
            id=uuid4(),
            email=data["email"],
            name=data["name"],
            phone=data.get("phone"),
            email_verified=True,
        )
        db.add(user)
        users.append(user)

    db.commit()
    return users


def seed_pets(db: Session, users: list[User]) -> list[Pet]:
    """Seed pets"""
    pets = []

    for i, (name, pet_type, breed, gender) in enumerate(PET_NAMES):
        user = users[i % len(users)]
        pet = Pet(
            id=uuid4(),
            user_id=user.id,
            name=name,
            type=pet_type,
            breed=breed,
            age=random.randint(1, 15),
            weight=round(random.uniform(2, 40), 1),
            gender=gender,
        )
        db.add(pet)
        pets.append(pet)

    db.commit()
    return pets


def seed_appointments(db: Session, vets: list[Vet], users: list[User], pets: list[Pet]) -> list[Appointment]:
    """Seed appointments"""
    appointments = []
    statuses = list(AppointmentStatus)

    # Create appointments for the past 60 days and next 30 days
    for _ in range(60):
        days_offset = random.randint(-60, 30)
        scheduled_date = datetime.now() + timedelta(days=days_offset)
        scheduled_date = scheduled_date.replace(
            hour=random.randint(9, 17),
            minute=random.choice([0, 15, 30, 45]),
            second=0,
            microsecond=0,
        )

        # Determine status based on date
        if days_offset < -7:
            status = random.choice([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED])
        elif days_offset < 0:
            status = random.choice([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.CONFIRMED])
        elif days_offset == 0:
            status = random.choice([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        else:
            status = random.choice([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])

        vet = random.choice(vets)
        user = random.choice(users)
        # Get a pet owned by this user, or any pet
        user_pets = [p for p in pets if p.user_id == user.id]
        pet = random.choice(user_pets) if user_pets else random.choice(pets)

        appointment = Appointment(
            id=uuid4(),
            vet_id=vet.id,
            user_id=user.id,
            pet_id=pet.id,
            scheduled_at=scheduled_date,
            duration_minutes=random.choice([15, 30, 45, 60]),
            type=random.choice(APPOINTMENT_TYPES),
            status=status,
            notes=f"Appointment for {pet.name}" if random.random() > 0.5 else None,
        )
        db.add(appointment)
        appointments.append(appointment)

    db.commit()
    return appointments


def seed_reviews(db: Session, vets: list[Vet], users: list[User], appointments: list[Appointment]) -> list[Review]:
    """Seed reviews"""
    reviews = []

    # Group completed appointments by vet
    completed = [a for a in appointments if a.status == AppointmentStatus.COMPLETED]

    for appointment in random.sample(completed, min(25, len(completed))):
        review = Review(
            id=uuid4(),
            vet_id=appointment.vet_id,
            user_id=appointment.user_id,
            appointment_id=appointment.id,
            rating=random.choices([5, 4, 3, 2, 1], weights=[50, 30, 10, 7, 3])[0],
            comment=random.choice(REVIEW_COMMENTS),
            reply="Thank you for your feedback!" if random.random() > 0.7 else None,
        )
        db.add(review)
        reviews.append(review)

    db.commit()

    # Update vet ratings
    for vet in vets:
        vet_reviews = [r for r in reviews if r.vet_id == vet.id]
        if vet_reviews:
            avg_rating = sum(r.rating for r in vet_reviews) / len(vet_reviews)
            vet.rating_average = round(avg_rating, 2)
            vet.reviews_count = len(vet_reviews)

    db.commit()
    return reviews


def seed_medical_events(db: Session, pets: list[Pet], vets: list[Vet]) -> list[MedicalEvent]:
    """Seed medical events"""
    events = []

    for pet in pets:
        # Create 1-5 medical events per pet
        for _ in range(random.randint(1, 5)):
            days_ago = random.randint(1, 365)
            event_date = date.today() - timedelta(days=days_ago)

            event = MedicalEvent(
                id=uuid4(),
                pet_id=pet.id,
                vet_id=random.choice(vets).id,
                date=event_date,
                title=f"{random.choice(MEDICAL_EVENT_TYPES)} for {pet.name}",
                notes=f"Routine {random.choice(MEDICAL_EVENT_TYPES).lower()} completed successfully." if random.random() > 0.5 else None,
                event_type=random.choice(MEDICAL_EVENT_TYPES),
            )
            db.add(event)
            events.append(event)

    db.commit()
    return events


def seed_database(db: Session):
    """Main function to seed the database"""
    print("Starting database seeding...")

    print("Seeding vets...")
    vets = seed_vets(db)
    print(f"Created {len(vets)} vets")

    print("Seeding users...")
    users = seed_users(db)
    print(f"Created {len(users)} users")

    print("Seeding pets...")
    pets = seed_pets(db, users)
    print(f"Created {len(pets)} pets")

    print("Seeding appointments...")
    appointments = seed_appointments(db, vets, users, pets)
    print(f"Created {len(appointments)} appointments")

    print("Seeding reviews...")
    reviews = seed_reviews(db, vets, users, appointments)
    print(f"Created {len(reviews)} reviews")

    print("Seeding medical events...")
    events = seed_medical_events(db, pets, vets)
    print(f"Created {len(events)} medical events")

    print("\nDatabase seeding completed!")
    print("\nTest credentials:")
    print("Email: sarah.johnson@vetly.com")
    print("Password: password123")
