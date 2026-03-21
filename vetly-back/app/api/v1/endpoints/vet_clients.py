"""
Vet client management endpoints
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.vet_client import VetClientService
from app.schemas.vet_client import (
    VetClientCreateRequest,
    VetClientListResponse,
    VetClientPetCreateRequest,
    VetClientPetResponse,
    VetClientPetUpdateRequest,
    VetClientResponse,
    InviteLinkResponse,
)

router = APIRouter()


@router.get("", response_model=VetClientListResponse)
def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str | None = Query(None),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetClientListResponse:
    service = VetClientService(db)
    return service.list_clients(current_vet.id, search=search, page=page, page_size=page_size)


@router.post("", response_model=VetClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    data: VetClientCreateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetClientResponse:
    service = VetClientService(db)
    return service.create_client(current_vet.id, data)


@router.get("/{client_id}", response_model=VetClientResponse)
def get_client(
    client_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetClientResponse:
    service = VetClientService(db)
    return service.get_client(client_id, current_vet.id)



@router.post("/{client_id}/invite", response_model=InviteLinkResponse)
def generate_invite(
    client_id: UUID,
    request: Request,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> InviteLinkResponse:
    base_url = str(request.base_url).rstrip("/").replace("/api/v1", "").replace(":8000", ":3000")
    service = VetClientService(db)
    return service.generate_invite(client_id, current_vet.id, base_url)


@router.put("/{client_id}/resend-invite", response_model=InviteLinkResponse)
def resend_invite(
    client_id: UUID,
    request: Request,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> InviteLinkResponse:
    """Resend an invite with a new token for an existing invited client"""
    base_url = str(request.base_url).rstrip("/").replace("/api/v1", "").replace(":8000", ":3000")
    service = VetClientService(db)
    return service.resend_invite(client_id, current_vet.id, base_url)


@router.post("/{client_id}/pets", response_model=VetClientPetResponse, status_code=status.HTTP_201_CREATED)
def add_pet(
    client_id: UUID,
    data: VetClientPetCreateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetClientPetResponse:
    service = VetClientService(db)
    return service.add_pet(client_id, current_vet.id, data)


@router.put("/{client_id}/pets/{pet_id}", response_model=VetClientPetResponse)
def update_pet(
    client_id: UUID,
    pet_id: UUID,
    data: VetClientPetUpdateRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> VetClientPetResponse:
    service = VetClientService(db)
    return service.update_pet(client_id, current_vet.id, pet_id, data)


@router.delete("/{client_id}/pets/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(
    client_id: UUID,
    pet_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> None:
    service = VetClientService(db)
    service.delete_pet(client_id, current_vet.id, pet_id)
