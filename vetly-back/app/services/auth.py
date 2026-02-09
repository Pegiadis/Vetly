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
    verify_password,
    get_password_hash,
)
from app.schemas.auth import LoginRequest, TokenResponse, VetRegisterRequest, PetOwnerRegisterRequest
from app.schemas.vet import VetResponse
from app.schemas.owner import PetOwnerResponse


class AuthService:
    """Service for authentication operations"""

    def __init__(self, db: Session):
        self.db = db

    def login_vet(self, credentials: LoginRequest) -> TokenResponse:
        """
        Authenticate a vet and return access token

        Args:
            credentials: Login credentials (email, password)

        Returns:
            TokenResponse with access token

        Raises:
            HTTPException: If credentials are invalid
        """
        # Find vet by email
        query = select(Vet).where(Vet.email == credentials.email)
        vet = self.db.scalar(query)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if vet has a password set
        if not vet.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not verify_password(credentials.password, vet.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token = create_access_token(subject=str(vet.id), token_type="vet")

        return TokenResponse(access_token=access_token)

    def register_vet(self, data: VetRegisterRequest) -> VetResponse:
        """
        Register a new vet account

        Args:
            data: Registration data

        Returns:
            Created vet response

        Raises:
            HTTPException: If email or license already exists
        """
        # Check if email already exists
        existing_email = self.db.scalar(select(Vet).where(Vet.email == data.email))
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Check if license number already exists
        existing_license = self.db.scalar(
            select(Vet).where(Vet.license_number == data.license_number)
        )
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License number already registered",
            )

        # Create new vet
        vet = Vet(
            email=data.email,
            password_hash=get_password_hash(data.password),
            name=data.name,
            specialty=data.specialty,
            license_number=data.license_number,
            phone=data.phone,
            address=data.address,
            city=data.city,
            description=data.description,
            image_url=data.image_url,
            is_verified=False,
            is_on_call=False,
        )

        self.db.add(vet)
        self.db.commit()
        self.db.refresh(vet)

        return VetResponse.model_validate(vet)

    def get_vet_by_id(self, vet_id: UUID) -> Vet | None:
        """
        Get a vet by ID

        Args:
            vet_id: The vet's UUID

        Returns:
            Vet model or None
        """
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def login_pet_owner(self, credentials: LoginRequest) -> TokenResponse:
        """
        Authenticate a pet owner and return access token

        Args:
            credentials: Login credentials (email, password)

        Returns:
            TokenResponse with access token

        Raises:
            HTTPException: If credentials are invalid
        """
        # Find pet owner by email
        query = select(PetOwner).where(PetOwner.email == credentials.email)
        pet_owner = self.db.scalar(query)

        if not pet_owner:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if pet owner has a password set
        if not pet_owner.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not verify_password(credentials.password, pet_owner.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token = create_access_token(subject=str(pet_owner.id), token_type="pet_owner")

        return TokenResponse(access_token=access_token)

    def register_pet_owner(self, data: PetOwnerRegisterRequest) -> PetOwnerResponse:
        """
        Register a new pet owner account

        Args:
            data: Registration data

        Returns:
            Created pet owner response

        Raises:
            HTTPException: If email already exists
        """
        # Check if email already exists
        existing_email = self.db.scalar(select(PetOwner).where(PetOwner.email == data.email))
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new pet owner
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

        return PetOwnerResponse.model_validate(pet_owner)
