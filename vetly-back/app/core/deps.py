"""
FastAPI dependencies for dependency injection
"""

from typing import Generator
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


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


# TODO: Add authentication dependencies here when implementing auth
# async def get_current_user(...)
# async def get_current_vet(...)
# async def get_current_pet_owner(...)
