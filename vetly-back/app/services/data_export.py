"""Account data export: everything the platform holds about one account, as plain JSON."""
import enum
from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import (
    Appointment, ChatConversation, ChatMessage, MedicalEvent, Medication, Notification, Pet,
    PetOwner, Reminder, Review, ServiceType, Vet, VetClient, VetClientPet, WeightHistory,
)

# Credentials, session counters and invite secrets are not account data.
SECRET_COLUMNS = {"password_hash", "auth_version", "invite_token"}


def _plain(value):
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, enum.Enum):
        return value.value
    return value


def row(obj, exclude: set[str] = frozenset()) -> dict:
    """One ORM row as a JSON-safe dict, without secret columns."""
    skip = SECRET_COLUMNS | set(exclude)
    return {c.name: _plain(getattr(obj, c.name)) for c in obj.__table__.columns if c.name not in skip}


def rows(objs, exclude: set[str] = frozenset()) -> list[dict]:
    return [row(o, exclude) for o in objs]


def _in(model_col, ids):
    return model_col.in_(ids) if ids else model_col.in_([UUID(int=0)])


def export_owner(db: Session, owner: PetOwner) -> dict:
    """Profile, pets and their records, appointments, reviews, reminders, notifications and chats."""
    pets = db.scalars(select(Pet).where(Pet.pet_owner_id == owner.id).order_by(Pet.created_at)).all()
    pet_ids = [p.id for p in pets]
    conversations = db.scalars(select(ChatConversation).where(ChatConversation.pet_owner_id == owner.id).order_by(ChatConversation.created_at)).all()
    chats = []
    for conv in conversations:
        messages = db.scalars(select(ChatMessage).where(ChatMessage.conversation_id == conv.id).order_by(ChatMessage.created_at)).all()
        chats.append({**row(conv), "messages": rows(messages)})
    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "account_type": "pet_owner",
        "profile": row(owner),
        "pets": rows(pets),
        "medical_events": rows(db.scalars(select(MedicalEvent).where(_in(MedicalEvent.pet_id, pet_ids)).order_by(MedicalEvent.date)).all()),
        "medications": rows(db.scalars(select(Medication).where(_in(Medication.pet_id, pet_ids)).order_by(Medication.created_at)).all()),
        "weights": rows(db.scalars(select(WeightHistory).where(_in(WeightHistory.pet_id, pet_ids)).order_by(WeightHistory.recorded_at)).all()),
        "appointments": rows(db.scalars(select(Appointment).where(Appointment.pet_owner_id == owner.id).order_by(Appointment.scheduled_at)).all()),
        "reviews": rows(db.scalars(select(Review).where(Review.pet_owner_id == owner.id).order_by(Review.created_at)).all()),
        "reminders": rows(db.scalars(select(Reminder).where(Reminder.pet_owner_id == owner.id).order_by(Reminder.due_date)).all()),
        "notifications": rows(db.scalars(select(Notification).where(Notification.pet_owner_id == owner.id).order_by(Notification.created_at)).all(), {"source_key"}),
        "chat_conversations": chats,
    }


def export_vet(db: Session, vet: Vet) -> dict:
    """Clinic account: profile, services, hours, clients and patients, appointments, reviews received."""
    clients = db.scalars(select(VetClient).where(VetClient.vet_id == vet.id).order_by(VetClient.created_at)).all()
    client_ids = [c.id for c in clients]
    client_pets = db.scalars(select(VetClientPet).where(_in(VetClientPet.vet_client_id, client_ids)).order_by(VetClientPet.created_at)).all()
    patients = db.scalars(select(Pet).where(_in(Pet.id, [p.pet_id for p in client_pets]))).all() if client_pets else []
    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "account_type": "vet",
        "profile": row(vet),
        "working_hours": vet.hours,
        "services": rows(db.scalars(select(ServiceType).where(ServiceType.vet_id == vet.id).order_by(ServiceType.name)).all()),
        "clients": rows(clients),
        "client_pets": rows(client_pets),
        "patients": rows(patients),
        "medical_events": rows(db.scalars(select(MedicalEvent).where(MedicalEvent.vet_id == vet.id).order_by(MedicalEvent.date)).all()),
        "appointments": rows(db.scalars(select(Appointment).where(Appointment.vet_id == vet.id).order_by(Appointment.scheduled_at)).all()),
        # Reviewers are identified only by their review text and rating.
        "reviews_received": rows(db.scalars(select(Review).where(Review.vet_id == vet.id).order_by(Review.created_at)).all(), {"pet_owner_id"}),
    }
