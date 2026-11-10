"""
Authentication API endpoints
"""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet, get_current_pet_owner
from app.core.rate_limit import email_request_limit, login_limit, register_limit, token_limit
from app.db.base import Vet, PetOwner
from app.services.auth import AuthService
from app.schemas.auth import (
    LoginRequest, TokenResponse, VetRegisterRequest, PetOwnerRegisterRequest,
    RegisterResponse, VerifyEmailRequest, VerifyEmailResponse, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.vet import VetResponse
from app.schemas.owner import PetOwnerResponse

router = APIRouter()


@router.post("/vet/login", response_model=TokenResponse, dependencies=[Depends(login_limit)])
def login_vet(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a vet and return access token"""
    service = AuthService(db)
    return service.login_vet(credentials)


@router.post("/vet/login/form", response_model=TokenResponse, dependencies=[Depends(login_limit)])
def login_vet_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a vet using OAuth2 form (for Swagger UI)"""
    service = AuthService(db)
    credentials = LoginRequest(email=form_data.username, password=form_data.password)
    return service.login_vet(credentials)


@router.post("/vet/register", response_model=RegisterResponse, status_code=201, dependencies=[Depends(register_limit)])
def register_vet(
    data: VetRegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    """Register a new vet account"""
    service = AuthService(db)
    return service.register_vet(data)


@router.get("/me", response_model=VetResponse)
def get_current_vet_profile(
    current_vet: Vet = Depends(get_current_vet),
) -> VetResponse:
    """Get the current authenticated vet's profile"""
    return VetResponse.model_validate(current_vet)


@router.post("/pet-owner/login", response_model=TokenResponse, dependencies=[Depends(login_limit)])
def login_pet_owner(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a pet owner and return access token"""
    service = AuthService(db)
    return service.login_pet_owner(credentials)


@router.post("/pet-owner/register", response_model=RegisterResponse, status_code=201, dependencies=[Depends(register_limit)])
def register_pet_owner(
    data: PetOwnerRegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    """Register a new pet owner account"""
    service = AuthService(db)
    return service.register_pet_owner(data)


@router.post("/verify-email", response_model=VerifyEmailResponse, dependencies=[Depends(token_limit)])
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> VerifyEmailResponse:
    """Verify email address using token"""
    service = AuthService(db)
    return service.verify_email(data)


@router.post("/resend-verification", dependencies=[Depends(email_request_limit)])
def resend_verification(
    data: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Resend verification email"""
    service = AuthService(db)
    return service.resend_verification(data.email, data.user_type, data.client)


@router.post("/forgot-password", dependencies=[Depends(email_request_limit)])
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Request a password reset email"""
    service = AuthService(db)
    return service.request_password_reset(data)


@router.post("/reset-password", response_model=VerifyEmailResponse, dependencies=[Depends(token_limit)])
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> VerifyEmailResponse:
    """Reset password using token"""
    service = AuthService(db)
    return service.reset_password(data)


@router.get("/pet-owner/me", response_model=PetOwnerResponse)
def get_current_pet_owner_profile(
    current_owner: PetOwner = Depends(get_current_pet_owner),
) -> PetOwnerResponse:
    """Get the current authenticated pet owner's profile"""
    return PetOwnerResponse.model_validate(current_owner)
