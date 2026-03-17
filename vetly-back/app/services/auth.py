"""
Authentication service - business logic for auth operations
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Vet, PetOwner
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    decode_email_verification_token,
    create_password_reset_token,
    decode_password_reset_token,
    verify_password,
    get_password_hash,
)
from app.core.email import send_verification_email, send_password_reset_email
from app.schemas.auth import (
    LoginRequest, TokenResponse, VetRegisterRequest, PetOwnerRegisterRequest,
    RegisterResponse, VerifyEmailRequest, VerifyEmailResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.vet import VetResponse
from app.schemas.owner import PetOwnerResponse
from app.utils.slug import generate_unique_slug


class AuthService:
    """Service for authentication operations"""

    def __init__(self, db: Session):
        self.db = db

    def login_vet(self, credentials: LoginRequest) -> TokenResponse:
        query = select(Vet).where(Vet.email == credentials.email)
        vet = self.db.scalar(query)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not vet.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(credentials.password, vet.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not vet.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified",
            )

        access_token = create_access_token(subject=str(vet.id), token_type="vet")
        return TokenResponse(access_token=access_token)

    def register_vet(self, data: VetRegisterRequest) -> RegisterResponse:
        existing_email = self.db.scalar(select(Vet).where(Vet.email == data.email))
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        existing_license = self.db.scalar(
            select(Vet).where(Vet.license_number == data.license_number)
        )
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License number already registered",
            )

        slug = generate_unique_slug(self.db, data.name)

        vet = Vet(
            email=data.email,
            password_hash=get_password_hash(data.password),
            name=data.name,
            slug=slug,
            specialty=data.specialty,
            license_number=data.license_number,
            phone=data.phone,
            address=data.address,
            city=data.city,
            description=data.description,
            image_url=data.image_url,
            is_verified=True,
            is_on_call=False,
            email_verified=False,
        )

        self.db.add(vet)
        self.db.commit()
        self.db.refresh(vet)

        token = create_email_verification_token(str(vet.id), "vet")
        send_verification_email(data.email, token, "vet")

        return RegisterResponse(
            message="Ελέγξτε το email σας για επιβεβαίωση.",
            email=data.email,
        )

    def get_vet_by_id(self, vet_id: UUID) -> Vet | None:
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def login_pet_owner(self, credentials: LoginRequest) -> TokenResponse:
        query = select(PetOwner).where(PetOwner.email == credentials.email)
        pet_owner = self.db.scalar(query)

        if not pet_owner:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not pet_owner.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(credentials.password, pet_owner.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not pet_owner.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified",
            )

        access_token = create_access_token(subject=str(pet_owner.id), token_type="pet_owner")
        return TokenResponse(access_token=access_token)

    def register_pet_owner(self, data: PetOwnerRegisterRequest) -> RegisterResponse:
        existing_email = self.db.scalar(select(PetOwner).where(PetOwner.email == data.email))
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        pet_owner = PetOwner(
            email=data.email,
            password_hash=get_password_hash(data.password),
            name=data.name,
            phone=data.phone,
            address=data.address,
            email_verified=False,
        )

        self.db.add(pet_owner)
        self.db.commit()
        self.db.refresh(pet_owner)

        token = create_email_verification_token(str(pet_owner.id), "pet_owner")
        send_verification_email(data.email, token, "pet_owner")

        return RegisterResponse(
            message="Ελέγξτε το email σας για επιβεβαίωση.",
            email=data.email,
        )

    def verify_email(self, data: VerifyEmailRequest) -> VerifyEmailResponse:
        token_data = decode_email_verification_token(data.token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

        user_id = token_data.sub
        user_type = token_data.type

        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.id == user_id))
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.id == user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.email_verified = True
        self.db.commit()

        access_token = create_access_token(subject=str(user.id), token_type=user_type)
        return VerifyEmailResponse(
            access_token=access_token,
            message="Email verified successfully",
        )

    def resend_verification(self, email: str, user_type: str) -> dict:
        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.email == email))
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.email == email))

        # Generic response to avoid revealing whether the email exists
        if user and not user.email_verified:
            token = create_email_verification_token(str(user.id), user_type)
            send_verification_email(email, token, user_type)

        return {"message": "Αν το email υπάρχει στο σύστημα, θα λάβετε ένα νέο email επιβεβαίωσης."}

    def request_password_reset(self, data: ForgotPasswordRequest) -> dict:
        if data.user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.email == data.email))
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.email == data.email))

        if user and user.email_verified:
            token = create_password_reset_token(str(user.id), data.user_type)
            send_password_reset_email(data.email, token, data.user_type)

        return {"message": "Αν το email υπάρχει στο σύστημα, θα λάβετε email για επαναφορά κωδικού."}

    def reset_password(self, data: ResetPasswordRequest) -> VerifyEmailResponse:
        token_data = decode_password_reset_token(data.token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μη έγκυρος ή ληγμένος σύνδεσμος επαναφοράς.",
            )

        user_id = token_data.sub
        user_type = token_data.type

        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.id == user_id))
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.id == user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ο χρήστης δεν βρέθηκε.",
            )

        user.password_hash = get_password_hash(data.new_password)
        self.db.commit()

        access_token = create_access_token(subject=str(user.id), token_type=user_type)
        return VerifyEmailResponse(
            access_token=access_token,
            message="Ο κωδικός ενημερώθηκε επιτυχώς.",
        )
