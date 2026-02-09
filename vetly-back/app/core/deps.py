"""
FastAPI dependencies for dependency injection
"""

from typing import Generator
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.base import Vet, PetOwner
from app.core.security import decode_token


# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/vet/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/pet-owner/login", auto_error=False)


def get_db() -> Generator:
    """
    Database session dependency

    Yields:
        SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_vet(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Vet:
    """
    Get the current authenticated vet from JWT token

    Args:
        token: JWT access token from Authorization header
        db: Database session

    Returns:
        Authenticated Vet model

    Raises:
        HTTPException: If token is invalid or vet not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode token
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception

    # Verify token type
    if token_data.type != "vet":
        raise credentials_exception

    # Get vet from database
    try:
        vet_id = UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    from sqlalchemy import select
    query = select(Vet).where(Vet.id == vet_id)
    vet = db.scalar(query)

    if vet is None:
        raise credentials_exception

    return vet


def get_current_pet_owner(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> PetOwner:
    """
    Get the current authenticated pet owner from JWT token

    Args:
        token: JWT access token from Authorization header
        db: Database session

    Returns:
        Authenticated PetOwner model

    Raises:
        HTTPException: If token is invalid or pet owner not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode token
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception

    # Verify token type
    if token_data.type != "pet_owner":
        raise credentials_exception

    # Get pet owner from database
    try:
        pet_owner_id = UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    from sqlalchemy import select
    query = select(PetOwner).where(PetOwner.id == pet_owner_id)
    pet_owner = db.scalar(query)

    if pet_owner is None:
        raise credentials_exception

    return pet_owner
