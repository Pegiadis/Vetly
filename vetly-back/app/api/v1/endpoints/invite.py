"""
Public invite endpoints for client registration
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.services.vet_client import VetClientService
from app.schemas.auth import TokenResponse
from app.schemas.vet_client import InviteInfoResponse, InviteRegisterRequest

router = APIRouter()


@router.get("/{token}", response_model=InviteInfoResponse)
def get_invite_info(
    token: str,
    db: Session = Depends(get_db),
) -> InviteInfoResponse:
    """Get invite information (public, no auth required)"""
    service = VetClientService(db)
    return service.get_invite_info(token)


@router.post("/{token}/register", response_model=TokenResponse)
def register_via_invite(
    token: str,
    data: InviteRegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Register as a pet owner through an invite link (public, no auth required)"""
    service = VetClientService(db)
    return service.register_via_invite(token, data)
