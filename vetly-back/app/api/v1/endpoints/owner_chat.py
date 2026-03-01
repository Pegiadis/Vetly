"""
Owner chat API endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_pet_owner
from app.db.base import PetOwner
from app.services.chat import ChatService
from app.schemas.chat import (
    ChatConversationDetailResponse,
    ChatConversationListResponse,
    ChatConversationResponse,
    ChatMessageResponse,
    ChatSendMessageRequest,
    ChatSendMessageResponse,
)

router = APIRouter()


@router.get("/conversations", response_model=ChatConversationListResponse)
def get_owner_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> ChatConversationListResponse:
    """Get chat conversations for the logged-in owner"""
    service = ChatService(db)
    items, total = service.get_conversations(
        pet_owner_id=current_owner.id, page=page, page_size=page_size
    )
    return ChatConversationListResponse(
        items=[ChatConversationResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ChatConversationDetailResponse,
)
def get_owner_conversation(
    conversation_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> ChatConversationDetailResponse:
    """Get a single conversation with messages"""
    service = ChatService(db)
    conversation = service.get_conversation(
        conversation_id, pet_owner_id=current_owner.id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ChatConversationDetailResponse.model_validate(conversation)


@router.post("/send", response_model=ChatSendMessageResponse)
def owner_send_message(
    body: ChatSendMessageRequest,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> ChatSendMessageResponse:
    """Send a message to the AI assistant"""
    service = ChatService(db)
    conversation, user_msg, assistant_msg = service.send_message(
        user_message=body.message,
        conversation_id=body.conversation_id,
        pet_owner_id=current_owner.id,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ChatSendMessageResponse(
        conversation_id=conversation.id,
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(assistant_msg),
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_owner_conversation(
    conversation_id: UUID,
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> None:
    """Delete a conversation"""
    service = ChatService(db)
    deleted = service.delete_conversation(
        conversation_id, pet_owner_id=current_owner.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
