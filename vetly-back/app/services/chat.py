"""
Chat service - handles AI chat logic with Google Gemini
Uses the new google-genai SDK (replaces deprecated google-generativeai)
"""

from datetime import date
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Pet, PetOwner, Vet, Appointment, MedicalEvent, Medication, Reminder
from app.repositories.chat import ChatRepository

BASE_SYSTEM_PROMPT = (
    "You are Vetly AI, a helpful veterinary assistant. "
    "You help pet owners and veterinarians with general pet-health questions, "
    "appointment guidance, medication reminders, and common veterinary topics. "
    "Always recommend consulting a licensed veterinarian for serious medical concerns. "
    "Reply in the same language as the user's message.\n\n"
    "IMPORTANT: You have been given context about this specific user below. "
    "Use this information to give personalized, relevant answers. "
    "Never reveal data about other users, pets, or vets that is not in your context. "
    "If the user asks about data you don't have, say you don't have access to that information."
)


class ChatService:
    """Service for AI chat operations"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ChatRepository(db)

    def get_conversations(
        self,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        skip = (page - 1) * page_size
        return self.repository.get_conversations(
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
            skip=skip,
            limit=page_size,
        )

    def get_conversation(
        self,
        conversation_id: UUID,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ):
        return self.repository.get_conversation_by_id(
            conversation_id,
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
        )

    def send_message(
        self,
        user_message: str,
        conversation_id: UUID | None = None,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ):
        """Send a user message and get an AI response"""
        # Get or create conversation
        if conversation_id:
            conversation = self.repository.get_conversation_by_id(
                conversation_id,
                pet_owner_id=pet_owner_id,
                vet_id=vet_id,
            )
            if not conversation:
                return None, None, None
        else:
            # Use first ~50 chars of message as title
            title = user_message[:50].strip()
            if len(user_message) > 50:
                title += "..."
            conversation = self.repository.create_conversation(
                title=title,
                pet_owner_id=pet_owner_id,
                vet_id=vet_id,
            )

        # Get existing messages for context
        existing_messages = self.repository.get_messages(conversation.id)

        # Save user message
        user_msg = self.repository.add_message(
            conversation.id, "user", user_message
        )

        # Build personalized system prompt
        system_prompt = self._build_system_prompt(
            pet_owner_id=pet_owner_id, vet_id=vet_id
        )

        # Generate AI response
        ai_response = self._generate_response(
            existing_messages, user_message, system_prompt
        )

        # Save assistant message
        assistant_msg = self.repository.add_message(
            conversation.id, "assistant", ai_response
        )

        return conversation, user_msg, assistant_msg

    def delete_conversation(
        self,
        conversation_id: UUID,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ) -> bool:
        conversation = self.repository.get_conversation_by_id(
            conversation_id,
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
        )
        if not conversation:
            return False
        self.repository.delete_conversation(conversation)
        return True

    def _build_system_prompt(
        self,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ) -> str:
        """Build a personalized system prompt with user-specific data"""
        context_parts: list[str] = [BASE_SYSTEM_PROMPT]

        if pet_owner_id:
            context_parts.append(self._get_owner_context(pet_owner_id))
        elif vet_id:
            context_parts.append(self._get_vet_context(vet_id))

        return "\n\n".join(context_parts)

    def _get_owner_context(self, owner_id: UUID) -> str:
        """Gather pet owner context: pets, appointments, medications, reminders"""
        owner = self.db.scalar(
            select(PetOwner).where(PetOwner.id == owner_id)
        )
        if not owner:
            return ""

        lines = [f"--- USER CONTEXT (Pet Owner) ---", f"Name: {owner.name}"]

        # Pets
        pets = list(self.db.scalars(
            select(Pet).where(Pet.pet_owner_id == owner_id)
        ).all())
        if pets:
            lines.append(f"\nPets ({len(pets)}):")
            for p in pets:
                age = ""
                if p.birth_date:
                    years = (date.today() - p.birth_date).days // 365
                    age = f", Age: {years}y"
                lines.append(
                    f"  - {p.name} ({p.type}, {p.breed or 'unknown breed'}{age}, "
                    f"Weight: {p.weight or '?'}kg)"
                )

                # Recent medical events for this pet (last 5)
                events = list(self.db.scalars(
                    select(MedicalEvent)
                    .where(MedicalEvent.pet_id == p.id)
                    .order_by(MedicalEvent.date.desc())
                    .limit(5)
                ).all())
                if events:
                    lines.append(f"    Recent medical history:")
                    for e in events:
                        lines.append(
                            f"      {e.date}: {e.event_type} - {e.title}"
                            f"{' (' + e.notes + ')' if e.notes else ''}"
                        )

        # Active medications
        meds = list(self.db.scalars(
            select(Medication).where(
                Medication.pet_id.in_([p.id for p in pets]),
                Medication.is_active == True,
            )
        ).all()) if pets else []
        if meds:
            lines.append(f"\nActive Medications ({len(meds)}):")
            for m in meds:
                pet_name = next((p.name for p in pets if p.id == m.pet_id), "?")
                lines.append(
                    f"  - {m.name} {m.dosage} ({m.frequency}) for {pet_name}"
                )

        # Upcoming appointments (next 5)
        from datetime import datetime
        now = datetime.now()
        appts = list(self.db.scalars(
            select(Appointment).where(
                Appointment.pet_owner_id == owner_id,
                Appointment.scheduled_at >= now,
                Appointment.status.in_(["confirmed", "pending"]),
            )
            .order_by(Appointment.scheduled_at.asc())
            .limit(5)
        ).all())
        if appts:
            lines.append(f"\nUpcoming Appointments ({len(appts)}):")
            for a in appts:
                pet_name = next((p.name for p in pets if p.id == a.pet_id), "?")
                lines.append(
                    f"  - {a.scheduled_at.strftime('%Y-%m-%d %H:%M')}: {pet_name} "
                    f"({a.status.value if hasattr(a.status, 'value') else a.status})"
                )

        # Active reminders
        reminders = list(self.db.scalars(
            select(Reminder).where(
                Reminder.pet_owner_id == owner_id,
                Reminder.status == "active",
                Reminder.due_date >= date.today(),
            )
            .order_by(Reminder.due_date.asc())
            .limit(10)
        ).all())
        if reminders:
            lines.append(f"\nUpcoming Reminders ({len(reminders)}):")
            for r in reminders:
                pet_name = next((p.name for p in pets if p.id == r.pet_id), "?")
                lines.append(
                    f"  - {r.due_date}: {r.title} ({r.type}) for {pet_name}"
                )

        return "\n".join(lines)

    def _get_vet_context(self, vet_id: UUID) -> str:
        """Gather vet context: profile, today's schedule, recent patients"""
        vet = self.db.scalar(select(Vet).where(Vet.id == vet_id))
        if not vet:
            return ""

        lines = [
            f"--- USER CONTEXT (Veterinarian) ---",
            f"Name: {vet.name}",
            f"Specialty: {vet.specialty or 'General'}",
        ]

        from datetime import datetime
        today = date.today()
        now = datetime.now()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # Today's appointments
        today_appts = list(self.db.scalars(
            select(Appointment).where(
                Appointment.vet_id == vet_id,
                Appointment.scheduled_at >= today_start,
                Appointment.scheduled_at <= today_end,
                Appointment.status.in_(["confirmed", "pending"]),
            )
            .order_by(Appointment.scheduled_at.asc())
        ).all())
        if today_appts:
            lines.append(f"\nToday's Schedule ({len(today_appts)} appointments):")
            for a in today_appts:
                pet = self.db.scalar(select(Pet).where(Pet.id == a.pet_id))
                pet_info = f"{pet.name} ({pet.type})" if pet else "Unknown"
                status_val = a.status.value if hasattr(a.status, 'value') else a.status
                lines.append(
                    f"  - {a.scheduled_at.strftime('%H:%M')}: {pet_info} ({status_val})"
                )

        # Pending appointments
        pending_count = self.db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.vet_id == vet_id,
                Appointment.status == "pending",
            )
        ) or 0
        if pending_count:
            lines.append(f"\nPending Appointments: {pending_count}")

        # Recent patients (last 10 completed appointments)
        recent = list(self.db.scalars(
            select(Appointment).where(
                Appointment.vet_id == vet_id,
                Appointment.status == "completed",
            )
            .order_by(Appointment.scheduled_at.desc())
            .limit(10)
        ).all())
        if recent:
            lines.append(f"\nRecent Patients:")
            seen_pets: set[str] = set()
            for a in recent:
                if str(a.pet_id) in seen_pets:
                    continue
                seen_pets.add(str(a.pet_id))
                pet = self.db.scalar(select(Pet).where(Pet.id == a.pet_id))
                if pet:
                    lines.append(
                        f"  - {pet.name} ({pet.type}, {pet.breed or '?'}) "
                        f"- last visit: {a.scheduled_at.strftime('%Y-%m-%d')}"
                    )

        # Active reminders this vet created
        reminders = list(self.db.scalars(
            select(Reminder).where(
                Reminder.vet_id == vet_id,
                Reminder.status == "active",
                Reminder.due_date >= today,
            )
            .order_by(Reminder.due_date.asc())
            .limit(10)
        ).all())
        if reminders:
            lines.append(f"\nActive Reminders ({len(reminders)}):")
            for r in reminders:
                pet = self.db.scalar(select(Pet).where(Pet.id == r.pet_id))
                pet_name = pet.name if pet else "?"
                lines.append(
                    f"  - {r.due_date}: {r.title} ({r.type}) for {pet_name}"
                )

        return "\n".join(lines)

    def _generate_response(
        self, existing_messages: list, new_message: str, system_prompt: str
    ) -> str:
        """Generate an AI response using Google Gemini (google-genai SDK)"""
        if not settings.GEMINI_API_KEY:
            return (
                "AI assistant is not configured. "
                "Please set the GEMINI_API_KEY environment variable."
            )

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build history from existing messages
            history = []
            for msg in existing_messages:
                role = "user" if msg.role == "user" else "model"
                history.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.content)],
                    )
                )

            chat = client.chats.create(
                model="gemini-2.0-flash",
                history=history,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                ),
            )

            response = chat.send_message(new_message)
            return response.text
        except (ConnectionError, TimeoutError, ValueError) as exc:
            return "Λυπάμαι, αντιμετώπισα ένα πρόβλημα. Παρακαλώ δοκιμάστε ξανά."
        except Exception as exc:
            print(f"[CHAT ERROR] Unexpected error: {exc}")
            return "Λυπάμαι, αντιμετώπισα ένα πρόβλημα. Παρακαλώ δοκιμάστε ξανά."
