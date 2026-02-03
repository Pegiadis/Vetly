"""
Authentication API endpoints
"""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.auth import AuthService
from app.schemas.auth import LoginRequest, TokenResponse, VetRegisterRequest
from app.schemas.vet import VetResponse

router = APIRouter()


@router.post("/vet/login", response_model=TokenResponse)
def login_vet(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a vet and return access token"""
    service = AuthService(db)
    return service.login_vet(credentials)


@router.post("/vet/login/form", response_model=TokenResponse)
def login_vet_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a vet using OAuth2 form (for Swagger UI)"""
    service = AuthService(db)
    credentials = LoginRequest(email=form_data.username, password=form_data.password)
    return service.login_vet(credentials)


@router.post("/vet/register", response_model=VetResponse, status_code=201)
def register_vet(
    data: VetRegisterRequest,
    db: Session = Depends(get_db),
) -> VetResponse:
    """Register a new vet account"""
    service = AuthService(db)
    return service.register_vet(data)


@router.get("/me", response_model=VetResponse)
def get_current_vet_profile(
    current_vet: Vet = Depends(get_current_vet),
) -> VetResponse:
    """Get the current authenticated vet's profile"""
    return VetResponse.model_validate(current_vet)
