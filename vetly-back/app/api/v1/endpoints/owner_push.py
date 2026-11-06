from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.deps import get_current_pet_owner, get_db
from app.db.base import PetOwner
from app.models.push import PushDevice

router = APIRouter()
class DeviceToken(BaseModel):
    token: str = Field(max_length=255, pattern=r'^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$')
class Registration(DeviceToken):
    platform: Literal['ios', 'android']

@router.post('')
def register(data: Registration, owner: PetOwner = Depends(get_current_pet_owner), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    db.execute(insert(PushDevice).values(owner_id=owner.id, token=data.token, platform=data.platform,
        auth_version=owner.auth_version, enabled=True, registered_at=now, last_seen_at=now).on_conflict_do_nothing(index_elements=['token']))
    device = db.scalar(select(PushDevice).where(PushDevice.token == data.token).with_for_update())
    if device.owner_id != owner.id or not device.enabled or device.auth_version != owner.auth_version:
        device.registered_at = now
    device.owner_id = owner.id
    device.auth_version = owner.auth_version
    device.enabled = True
    device.platform = data.platform
    device.last_seen_at = now
    db.commit()
    return {'registered': True, 'delivery_enabled': settings.PUSH_NOTIFICATIONS_ENABLED}

@router.delete('')
def unregister(data: DeviceToken, owner: PetOwner = Depends(get_current_pet_owner), db: Session = Depends(get_db)):
    device = db.scalar(select(PushDevice).where(PushDevice.token == data.token, PushDevice.owner_id == owner.id).with_for_update())
    if device:
        device.enabled = False
        db.commit()
    return {'registered': False}
