"""
Chat schemas for request/response validation
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    """Single chat message response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime


class ChatConversationResponse(BaseModel):
    """Conversation response (without messages)"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ChatConversationDetailResponse(ChatConversationResponse):
    """Conversation response with messages"""
    messages: list[ChatMessageResponse] = []


class ChatConversationListResponse(BaseModel):
    """Paginated list of conversations"""
    items: list[ChatConversationResponse]
    total: int
    page: int
    page_size: int


class ChatSendMessageRequest(BaseModel):
    """Request to send a message to the AI"""
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: UUID | None = None


class ChatSendMessageResponse(BaseModel):
    """Response after sending a message"""
    conversation_id: UUID
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
