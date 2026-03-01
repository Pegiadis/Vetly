"""
Chat models for AI chatbot conversations
"""

from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class ChatConversation(BaseModel):
    """
    Chat conversation model
    Represents a conversation thread between a user and the AI assistant
    """

    __tablename__ = "chat_conversations"

    # Foreign Keys (one of these should be set)
    pet_owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pet_owners.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    vet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    title = Column(String(255), nullable=False, default="New Conversation")

    # Relationships
    pet_owner = relationship("PetOwner", back_populates="chat_conversations")
    vet = relationship("Vet", back_populates="chat_conversations")
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self):
        return f"<ChatConversation(id={self.id}, title={self.title})>"


class ChatMessage(BaseModel):
    """
    Chat message model
    Represents a single message in a conversation
    """

    __tablename__ = "chat_messages"

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role})>"
