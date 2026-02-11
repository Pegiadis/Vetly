"""
Database seeding script for development and testing
"""

import random
from datetime import datetime, timedelta, date
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.base import Vet, PetOwner, Pet, Appointment, Review, MedicalEvent, Medication, Notification
from app.models.pet import PetType, Gender
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency
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

PET_OWNER_DATA = [
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


def seed_pet_owners(db: Session) -> list[PetOwner]:
    """Seed pet owners"""
    pet_owners = []
    default_password = get_password_hash("password123")

    for data in PET_OWNER_DATA:
        pet_owner = PetOwner(
            id=uuid4(),
            email=data["email"],
            password_hash=default_password,
            name=data["name"],
            phone=data.get("phone"),
            email_verified=True,
        )
        db.add(pet_owner)
        pet_owners.append(pet_owner)

    db.commit()
    return pet_owners


def seed_pets(db: Session, pet_owners: list[PetOwner]) -> list[Pet]:
    """Seed pets"""
    pets = []

    for i, (name, pet_type, breed, gender) in enumerate(PET_NAMES):
        pet_owner = pet_owners[i % len(pet_owners)]
        pet = Pet(
            id=uuid4(),
            pet_owner_id=pet_owner.id,
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


def seed_appointments(db: Session, vets: list[Vet], pet_owners: list[PetOwner], pets: list[Pet]) -> list[Appointment]:
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
        pet_owner = random.choice(pet_owners)
        # Get a pet owned by this pet owner, or any pet
        owner_pets = [p for p in pets if p.pet_owner_id == pet_owner.id]
        pet = random.choice(owner_pets) if owner_pets else random.choice(pets)

        appointment = Appointment(
            id=uuid4(),
            vet_id=vet.id,
            pet_owner_id=pet_owner.id,
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


def seed_reviews(db: Session, vets: list[Vet], pet_owners: list[PetOwner], appointments: list[Appointment]) -> list[Review]:
    """Seed reviews"""
    reviews = []

    # Group completed appointments by vet
    completed = [a for a in appointments if a.status == AppointmentStatus.COMPLETED]

    for appointment in random.sample(completed, min(25, len(completed))):
        review = Review(
            id=uuid4(),
            vet_id=appointment.vet_id,
            pet_owner_id=appointment.pet_owner_id,
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


MEDICATION_DATA = [
    {"name": "Αντιπαρασιτικό Frontline", "dosage": "1 αμπούλα", "frequency": MedicationFrequency.ONCE, "notes": "Εφαρμογή στον αυχένα"},
    {"name": "Χάπι για αρθρώσεις", "dosage": "1 χάπι", "frequency": MedicationFrequency.DAILY, "notes": "Με το φαγητό"},
    {"name": "Βιταμίνες", "dosage": "1/2 κ.γ.", "frequency": MedicationFrequency.DAILY, "notes": "Ανακατεύουμε με τροφή"},
    {"name": "Αντιισταμινικό", "dosage": "1/4 χάπι", "frequency": MedicationFrequency.DAILY, "notes": "Για αλλεργία"},
    {"name": "Αντιβιοτικό Amoxicillin", "dosage": "250mg", "frequency": MedicationFrequency.DAILY, "notes": "Πρωί και βράδυ"},
    {"name": "Αποπαρασιτικό", "dosage": "1 χάπι", "frequency": MedicationFrequency.ONCE, "notes": None},
]


def seed_medications(db: Session, pets: list[Pet]) -> list[Medication]:
    """Seed medications for pets"""
    from datetime import time
    medications = []

    for pet in pets:
        num_meds = random.randint(1, 3)
        chosen = random.sample(MEDICATION_DATA, min(num_meds, len(MEDICATION_DATA)))

        for med_data in chosen:
            days_ago = random.randint(10, 180)
            start = date.today() - timedelta(days=days_ago)
            is_active = random.random() > 0.3
            end = None if is_active else start + timedelta(days=random.randint(14, 60))
            hour = random.choice([8, 9, 12, 18, 20])

            med = Medication(
                id=uuid4(),
                pet_id=pet.id,
                name=med_data["name"],
                dosage=med_data["dosage"],
                frequency=med_data["frequency"],
                time=time(hour=hour, minute=0),
                start_date=start,
                end_date=end,
                notes=med_data["notes"],
                is_active=is_active,
            )
            db.add(med)
            medications.append(med)

    db.commit()
    return medications


NOTIFICATION_TEMPLATES = [
    {"type": "appointment", "title": "Επιβεβαίωση ραντεβού", "message": "Το ραντεβού σας επιβεβαιώθηκε."},
    {"type": "appointment", "title": "Ακύρωση ραντεβού", "message": "Ένα ραντεβού σας ακυρώθηκε."},
    {"type": "medication", "title": "Υπενθύμιση φαρμάκου", "message": "Ώρα για τη φαρμακευτική αγωγή του κατοικιδίου σας!"},
    {"type": "reminder", "title": "Υπενθύμιση ραντεβού", "message": "Έχετε ραντεβού αύριο. Μην ξεχάσετε!"},
    {"type": "reply", "title": "Νέα απάντηση στην αξιολόγησή σας", "message": "Ένας κτηνίατρος απάντησε στην αξιολόγησή σας."},
    {"type": "system", "title": "Καλώς ήρθατε στο Vetly!", "message": "Ευχαριστούμε για την εγγραφή σας. Ανακαλύψτε τις δυνατότητες της εφαρμογής."},
    {"type": "system", "title": "Ενημέρωση συστήματος", "message": "Νέες δυνατότητες είναι τώρα διαθέσιμες στο Vetly."},
    {"type": "medication", "title": "Λήξη φαρμάκου", "message": "Η αγωγή ενός φαρμάκου ολοκληρώθηκε."},
]


def seed_notifications(db: Session, pet_owners: list[PetOwner]) -> list[Notification]:
    """Seed notifications for pet owners"""
    notifications = []

    for owner in pet_owners:
        num = random.randint(3, 6)
        chosen = random.sample(NOTIFICATION_TEMPLATES, min(num, len(NOTIFICATION_TEMPLATES)))

        for i, tmpl in enumerate(chosen):
            hours_ago = random.randint(1, 720)
            created = datetime.now() - timedelta(hours=hours_ago)
            is_read = i >= 2  # first 2 are unread

            notif = Notification(
                id=uuid4(),
                pet_owner_id=owner.id,
                type=tmpl["type"],
                title=tmpl["title"],
                message=tmpl["message"],
                is_read=is_read,
            )
            # Manually set created_at after creation
            db.add(notif)
            notifications.append(notif)

        db.flush()
        # Update created_at for this owner's notifications
        for j, n in enumerate(notifications[-num:]):
            hours_ago = random.randint(1, 720)
            n.created_at = datetime.now() - timedelta(hours=hours_ago)

    db.commit()
    return notifications


def clear_database(db: Session):
    """Clear all data from the database"""
    from sqlalchemy import text
    print("Clearing existing data...")
    # Delete in order respecting foreign key constraints
    db.execute(text("DELETE FROM notifications"))
    db.execute(text("DELETE FROM reviews"))
    db.execute(text("DELETE FROM medical_events"))
    db.execute(text("DELETE FROM weight_history"))
    db.execute(text("DELETE FROM medications"))
    db.execute(text("DELETE FROM appointments"))
    db.execute(text("DELETE FROM pets"))
    db.execute(text("DELETE FROM pet_owners"))
    db.execute(text("DELETE FROM vets"))
    db.commit()
    print("Database cleared.")


def seed_database(db: Session, clear_first: bool = True):
    """Main function to seed the database"""
    if clear_first:
        clear_database(db)
    print("Starting database seeding...")

    print("Seeding vets...")
    vets = seed_vets(db)
    print(f"Created {len(vets)} vets")

    print("Seeding pet owners...")
    pet_owners = seed_pet_owners(db)
    print(f"Created {len(pet_owners)} pet owners")

    print("Seeding pets...")
    pets = seed_pets(db, pet_owners)
    print(f"Created {len(pets)} pets")

    print("Seeding appointments...")
    appointments = seed_appointments(db, vets, pet_owners, pets)
    print(f"Created {len(appointments)} appointments")

    print("Seeding reviews...")
    reviews = seed_reviews(db, vets, pet_owners, appointments)
    print(f"Created {len(reviews)} reviews")

    print("Seeding medical events...")
    events = seed_medical_events(db, pets, vets)
    print(f"Created {len(events)} medical events")

    print("Seeding medications...")
    medications = seed_medications(db, pets)
    print(f"Created {len(medications)} medications")

    print("Seeding notifications...")
    notifications = seed_notifications(db, pet_owners)
    print(f"Created {len(notifications)} notifications")

    print("\nDatabase seeding completed!")
    print("\nTest credentials:")
    print("Vet: sarah.johnson@vetly.com / password123")
    print("Pet Owner: john.smith@example.com / password123")
