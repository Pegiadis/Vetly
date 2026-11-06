"""Authenticated owner account settings. Mutations are scoped to the caller."""
import logging
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_pet_owner
from app.core.security import verify_password, get_password_hash
from app.db.base import PetOwner, Pet, Appointment
from app.models.appointment import AppointmentStatus
from app.utils.upload import delete_upload

router = APIRouter()

class Preferences(BaseModel):
    email_appointments: bool
    email_reminders: bool
    model_config = {"from_attributes": True, "extra": "forbid"}

class PasswordConfirmation(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)

class PasswordChange(PasswordConfirmation):
    new_password: str = Field(min_length=10, max_length=72)
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, value):
        if len(value.encode('utf-8')) > 72 or not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError('Χρησιμοποιήστε γράμματα και αριθμούς, έως 72 bytes.')
        return value

class DeleteAccount(PasswordConfirmation):
    confirmation: Literal['ΔΙΑΓΡΑΦΗ']


def locked_owner(db, owner):
    return db.scalar(select(PetOwner).where(PetOwner.id == owner.id).with_for_update().execution_options(populate_existing=True))

def check_password(owner, password):
    try:
        valid = owner.password_hash and verify_password(password, owner.password_hash)
    except ValueError:
        valid = False
    if not valid:
        # Not 401: this is reauthentication failure, not an expired session.
        raise HTTPException(400, 'Ο τρέχων κωδικός δεν είναι σωστός.')

@router.get('', response_model=Preferences)
def get_settings(owner: PetOwner = Depends(get_current_pet_owner)):
    return owner

@router.put('', response_model=Preferences)
def update_settings(data: Preferences, db: Session = Depends(get_db), owner: PetOwner = Depends(get_current_pet_owner)):
    owner = locked_owner(db, owner)
    owner.email_appointments = data.email_appointments
    owner.email_reminders = data.email_reminders
    db.commit()
    return owner

@router.post('/password', status_code=204)
def change_password(data: PasswordChange, db: Session = Depends(get_db), owner: PetOwner = Depends(get_current_pet_owner)):
    owner = locked_owner(db, owner)
    check_password(owner, data.current_password)
    if data.current_password == data.new_password:
        raise HTTPException(400, 'Επιλέξτε διαφορετικό νέο κωδικό.')
    owner.password_hash = get_password_hash(data.new_password)
    owner.auth_version += 1
    db.commit()

@router.post('/logout-all', status_code=204)
def logout_all(data: PasswordConfirmation, db: Session = Depends(get_db), owner: PetOwner = Depends(get_current_pet_owner)):
    owner = locked_owner(db, owner)
    check_password(owner, data.current_password)
    owner.auth_version += 1
    db.commit()

@router.post('/delete-account', status_code=204)
def delete_account(data: DeleteAccount, db: Session = Depends(get_db), owner: PetOwner = Depends(get_current_pet_owner)):
    owner = locked_owner(db, owner)
    check_password(owner, data.current_password)
    active = db.scalar(select(Appointment.id).where(Appointment.pet_owner_id == owner.id, Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])).limit(1))
    if active:
        raise HTTPException(409, 'Ακυρώστε ή ολοκληρώστε πρώτα τα εκκρεμή και επιβεβαιωμένα ραντεβού σας.')
    pets = db.scalars(select(Pet).where(Pet.pet_owner_id == owner.id)).all()
    images = [owner.image_url] + [url for pet in pets for url in (pet.image_url, pet.cover_image_url)]
    # Database cascades remove account-owned records; independent clinic records remain.
    db.execute(delete(PetOwner).where(PetOwner.id == owner.id))
    db.commit()
    for url in images:
        if url:
            try:
                delete_upload(url)
            except OSError:
                logging.getLogger(__name__).exception('Account image cleanup failed')
