"""
Database seeding script for development and testing
"""

import random
from datetime import datetime, timedelta, date
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.base import Vet, PetOwner, Pet, Appointment, Review, MedicalEvent, Medication, Notification, WeightHistory, BlogPost
from app.models.pet import PetType, Gender
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency
from app.core.security import get_password_hash


# Sample data
VET_DATA = [
    {
        "name": "Δρ. Νίκος Παπαδόπουλος",
        "email": "nikos.papadopoulos@vetly.com",
        "specialty": "Γενική Ιατρική",
        "license_number": "VET-001-2024",
        "phone": "+30 2310 123456",
        "address": "Τσιμισκή 42",
        "city": "Θεσσαλονίκη",
        "description": "Έμπειρος γενικός κτηνίατρος με 10 χρόνια εμπειρία στη φροντίδα μικρών ζώων.",
        "is_verified": True,
        "coordinates_lat": 40.6301,
        "coordinates_lng": 22.9474,
    },
    {
        "name": "Δρ. Μαρία Κωνσταντίνου",
        "email": "maria.konstantinou@vetly.com",
        "specialty": "Χειρουργική",
        "license_number": "VET-002-2024",
        "phone": "+30 2310 234567",
        "address": "Πλαστήρα 18",
        "city": "Θεσσαλονίκη",
        "description": "Πιστοποιημένη κτηνιατρική χειρουργός με ειδίκευση σε ορθοπεδικές επεμβάσεις.",
        "is_verified": True,
        "coordinates_lat": 40.5856,
        "coordinates_lng": 22.9517,
    },
    {
        "name": "Δρ. Γιώργος Αλεξίου",
        "email": "giorgos.alexiou@vetly.com",
        "specialty": "Δερματολογία",
        "license_number": "VET-003-2024",
        "phone": "+30 2310 345678",
        "address": "Βούλγαρη 75",
        "city": "Θεσσαλονίκη",
        "description": "Ειδικός στη δερματολογία και αντιμετώπιση αλλεργιών ζώων.",
        "is_verified": True,
        "coordinates_lat": 40.6145,
        "coordinates_lng": 22.9650,
    },
    {
        "name": "Δρ. Ελένη Δημητρίου",
        "email": "eleni.dimitriou@vetly.com",
        "specialty": "Επείγοντα",
        "license_number": "VET-004-2024",
        "phone": "+30 2310 456789",
        "address": "Μοναστηρίου 112",
        "city": "Θεσσαλονίκη",
        "description": "Εξειδικευμένη κτηνιατρική φροντίδα επειγόντων περιστατικών 24/7.",
        "is_verified": True,
        "is_on_call": True,
        "coordinates_lat": 40.6567,
        "coordinates_lng": 22.9067,
    },
    {
        "name": "Δρ. Κώστας Νικολάου",
        "email": "kostas.nikolaou@vetly.com",
        "specialty": "Οδοντιατρική",
        "license_number": "VET-005-2024",
        "phone": "+30 2310 567890",
        "address": "Ανδρέα Παπανδρέου 29",
        "city": "Θεσσαλονίκη",
        "description": "Ειδικός κτηνιατρικής οδοντιατρικής με εξειδίκευση στη στοματική χειρουργική.",
        "is_verified": False,
        "coordinates_lat": 40.5990,
        "coordinates_lng": 22.9880,
    },
]

PET_OWNER_DATA = [
    {"name": "Γιάννης Παπαδάκης", "email": "giannis.papadakis@example.com", "phone": "+30 6971 111111"},
    {"name": "Μαρία Γεωργίου", "email": "maria.georgiou@example.com", "phone": "+30 6972 222222"},
    {"name": "Κώστας Νικολαΐδης", "email": "kostas.nikolaidis@example.com", "phone": "+30 6973 333333"},
    {"name": "Ελένη Βασιλείου", "email": "eleni.vasileiou@example.com", "phone": "+30 6974 444444"},
    {"name": "Δημήτρης Αντωνίου", "email": "dimitris.antoniou@example.com", "phone": "+30 6975 555555"},
    {"name": "Σοφία Καραγιάννη", "email": "sofia.karagianni@example.com", "phone": "+30 6976 666666"},
    {"name": "Νίκος Αλεξόπουλος", "email": "nikos.alexopoulos@example.com", "phone": "+30 6977 777777"},
    {"name": "Αθηνά Παπαγεωργίου", "email": "athina.papageorgiou@example.com", "phone": "+30 6978 888888"},
    {"name": "Πέτρος Δημητράκης", "email": "petros.dimitrakis@example.com", "phone": "+30 6979 999999"},
    {"name": "Χριστίνα Λευκαδίτη", "email": "christina.lefkaditi@example.com", "phone": "+30 6970 000000"},
    {"name": "Αλέξανδρος Σταυρίδης", "email": "alex.stavridis@example.com", "phone": "+30 6971 121212"},
    {"name": "Κατερίνα Μαρκοπούλου", "email": "katerina.markopoulou@example.com", "phone": "+30 6972 131313"},
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
            coordinates_lat=data.get("coordinates_lat"),
            coordinates_lng=data.get("coordinates_lng"),
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


BLOG_POST_DATA = [
    {
        "title": "Essential Tips for First-Time Dog Owners",
        "excerpt": "Bringing home a new dog is exciting! Here are the essential things you need to know.",
        "content": "# Essential Tips for First-Time Dog Owners\n\nBringing home your first dog is an exciting experience...",
        "author": "Dr. Sarah Johnson",
        "category": "Pet Care",
        "read_time": "5 min read",
    },
    {
        "title": "Understanding Your Cat's Body Language",
        "excerpt": "Cats communicate through subtle body language. Learn to read the signs.",
        "content": "# Understanding Your Cat's Body Language\n\nCats are mysterious creatures...",
        "author": "Dr. Emily Rodriguez",
        "category": "Pet Behavior",
        "read_time": "4 min read",
    },
    {
        "title": "The Importance of Regular Veterinary Checkups",
        "excerpt": "Prevention is better than cure. Here's why regular vet visits matter.",
        "content": "# The Importance of Regular Veterinary Checkups\n\nRegular veterinary checkups are essential...",
        "author": "Dr. Michael Chen",
        "category": "Health",
        "read_time": "6 min read",
    },
]


def seed_weight_history(db: Session, pets: list[Pet]) -> list[WeightHistory]:
    """Seed weight tracking history for pets"""
    history = []
    base_date = date.today() - timedelta(days=180)

    for pet in pets[:8]:  # Weight history for first 8 pets
        base_weight = pet.weight or random.uniform(3, 35)
        for i in range(7):
            record = WeightHistory(
                id=uuid4(),
                pet_id=pet.id,
                weight=round(base_weight + (i * random.uniform(-0.2, 0.3)), 1),
                recorded_at=base_date + timedelta(days=i * 30),
            )
            db.add(record)
            history.append(record)

    db.commit()
    return history


def seed_blog_posts(db: Session, vets: list[Vet]) -> list[BlogPost]:
    """Seed blog posts"""
    posts = []

    for i, data in enumerate(BLOG_POST_DATA):
        vet = vets[i % len(vets)]
        days_ago = random.randint(10, 90)
        post = BlogPost(
            id=uuid4(),
            title=data["title"],
            excerpt=data["excerpt"],
            content=data["content"],
            author=data["author"],
            author_id=vet.id,
            category=data["category"],
            read_time=data["read_time"],
            published_at=datetime.now() - timedelta(days=days_ago),
        )
        db.add(post)
        posts.append(post)

    db.commit()
    return posts


def clear_database(db: Session):
    """Clear all data from the database"""
    from sqlalchemy import text
    print("Clearing existing data...")
    # Delete in order respecting foreign key constraints
    db.execute(text("DELETE FROM notifications"))
    db.execute(text("DELETE FROM reviews"))
    db.execute(text("DELETE FROM blog_posts"))
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

    print("Seeding weight history...")
    weight_records = seed_weight_history(db, pets)
    print(f"Created {len(weight_records)} weight records")

    print("Seeding blog posts...")
    blog_posts = seed_blog_posts(db, vets)
    print(f"Created {len(blog_posts)} blog posts")

    print("\nDatabase seeding completed!")
    print("\nTest credentials:")
    print("Vet: nikos.papadopoulos@vetly.com / password123")
    print("Pet Owner: giannis.papadakis@example.com / password123")
