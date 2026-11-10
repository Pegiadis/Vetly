"""Authenticated vet account security. Mutations are scoped to the caller."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.core.rate_limit import login_limit
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.base import Vet
from app.schemas.auth import TokenResponse

router = APIRouter()


class PasswordConfirmation(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)


class PasswordChange(PasswordConfirmation):
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator('new_password')
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode('utf-8')) > 72:
            raise ValueError('Ο κωδικός πρέπει να είναι έως 72 bytes.')
        return value


def locked_vet(db: Session, vet: Vet) -> Vet:
    return db.scalar(select(Vet).where(Vet.id == vet.id).with_for_update().execution_options(populate_existing=True))


def check_password(vet: Vet, password: str) -> None:
    try:
        valid = bool(vet.password_hash) and verify_password(password, vet.password_hash)
    except ValueError:
        valid = False
    if not valid:
        # Not 401: this is a reauthentication failure, not an expired session.
        raise HTTPException(400, 'Ο τρέχων κωδικός δεν είναι σωστός.')


def fresh_token(vet: Vet) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(subject=str(vet.id), token_type="vet", version=vet.auth_version))


@router.post('/password', response_model=TokenResponse, dependencies=[Depends(login_limit)])
def change_password(data: PasswordChange, db: Session = Depends(get_db), vet: Vet = Depends(get_current_vet)):
    """Change the password, sign out every other device, and keep this one signed in."""
    vet = locked_vet(db, vet)
    check_password(vet, data.current_password)
    if data.current_password == data.new_password:
        raise HTTPException(400, 'Επιλέξτε διαφορετικό νέο κωδικό.')
    vet.password_hash = get_password_hash(data.new_password)
    vet.auth_version += 1
    db.commit()
    return fresh_token(vet)


@router.post('/logout-all', response_model=TokenResponse, dependencies=[Depends(login_limit)])
def logout_all(data: PasswordConfirmation, db: Session = Depends(get_db), vet: Vet = Depends(get_current_vet)):
    """Sign out every other device; the returned token keeps this one signed in."""
    vet = locked_vet(db, vet)
    check_password(vet, data.current_password)
    vet.auth_version += 1
    db.commit()
    return fresh_token(vet)
