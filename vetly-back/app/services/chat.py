"""
Chat service - handles AI chat logic with Google Gemini
Uses the new google-genai SDK (replaces deprecated google-generativeai)
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.chat import ChatRepository

SYSTEM_PROMPT = (
    "You are Vetly AI, a helpful veterinary assistant. "
    "You help pet owners and veterinarians with general pet-health questions, "
    "appointment guidance, medication reminders, and common veterinary topics. "
    "Always recommend consulting a licensed veterinarian for serious medical concerns. "
    "Reply in the same language as the user's message."
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

        # Generate AI response
        ai_response = self._generate_response(existing_messages, user_message)

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

    def _generate_response(self, existing_messages: list, new_message: str) -> str:
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
                    system_instruction=SYSTEM_PROMPT,
                ),
            )

            response = chat.send_message(new_message)
            return response.text
        except Exception as exc:
            return f"Sorry, I encountered an error: {str(exc)}"
