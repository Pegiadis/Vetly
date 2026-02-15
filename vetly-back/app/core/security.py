"""
Security utilities for JWT tokens and password hashing
"""

from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
ALGORITHM = "HS256"


class TokenData(BaseModel):
    """Decoded token data"""
    sub: str
    type: str = "vet"
    exp: datetime | None = None


def create_access_token(subject: str, token_type: str = "vet", expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token

    Args:
        subject: The subject of the token (usually user ID)
        token_type: Type of user (vet, user)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "type": token_type,
        "exp": expire,
        "iat": datetime.utcnow(),
    }

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData | None:
    """
    Decode and validate a JWT token

    Args:
        token: The JWT token string

    Returns:
        TokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return TokenData(
            sub=payload.get("sub"),
            type=payload.get("type", "vet"),
            exp=payload.get("exp"),
        )
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash

    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password

    Args:
        password: The plain text password

    Returns:
        The hashed password
    """
    return pwd_context.hash(password)
