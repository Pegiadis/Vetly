"""
Repository for chat database operations
"""

from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import ChatConversation, ChatMessage


class ChatRepository:
    """Repository for chat database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create_conversation(
        self,
        title: str = "New Conversation",
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ) -> ChatConversation:
        """Create a new conversation"""
        conversation = ChatConversation(
            id=uuid4(),
            title=title,
            pet_owner_id=pet_owner_id,
            vet_id=vet_id,
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation_by_id(
        self,
        conversation_id: UUID,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
    ) -> ChatConversation | None:
        """Get a conversation by ID, scoped to the owner"""
        query = select(ChatConversation).where(
            ChatConversation.id == conversation_id
        )
        if pet_owner_id is not None:
            query = query.where(ChatConversation.pet_owner_id == pet_owner_id)
        if vet_id is not None:
            query = query.where(ChatConversation.vet_id == vet_id)
        return self.db.scalar(query)

    def get_conversations(
        self,
        pet_owner_id: UUID | None = None,
        vet_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[ChatConversation], int]:
        """Get paginated conversations for a user"""
        conditions = []
        if pet_owner_id is not None:
            conditions.append(ChatConversation.pet_owner_id == pet_owner_id)
        if vet_id is not None:
            conditions.append(ChatConversation.vet_id == vet_id)

        query = (
            select(ChatConversation)
            .where(*conditions)
            .order_by(ChatConversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.db.scalars(query).all())
        total = self.db.scalar(
            select(func.count(ChatConversation.id)).where(*conditions)
        ) or 0
        return items, total

    def add_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
    ) -> ChatMessage:
        """Add a message to a conversation"""
        message = ChatMessage(
            id=uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_messages(
        self,
        conversation_id: UUID,
    ) -> list[ChatMessage]:
        """Get all messages for a conversation, ordered by creation time"""
        query = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(self.db.scalars(query).all())

    def get_recent_messages(
        self,
        conversation_id: UUID,
        limit: int = 20,
    ) -> list[ChatMessage]:
        """Return the most recent N messages in chronological order.

        Used when building Gemini conversation history — capping prevents
        unbounded token growth as conversations get long.
        """
        query = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        return list(reversed(list(self.db.scalars(query).all())))

    def delete_conversation(self, conversation: ChatConversation) -> None:
        """Delete a conversation and all its messages"""
        self.db.delete(conversation)
        self.db.commit()
