"""Registered installations and durable Expo delivery receipts."""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import BaseModel

class PushDevice(BaseModel):
    __tablename__ = 'push_devices'
    owner_id = Column(UUID(as_uuid=True), ForeignKey('pet_owners.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True)
    platform = Column(String(10), nullable=False)
    auth_version = Column(Integer, nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    registered_at = Column(DateTime, nullable=False)
    last_seen_at = Column(DateTime, nullable=False)

class PushDelivery(BaseModel):
    __tablename__ = 'push_deliveries'
    __table_args__ = (UniqueConstraint('device_id', 'notification_id', name='uq_push_delivery'),)
    device_id = Column(UUID(as_uuid=True), ForeignKey('push_devices.id', ondelete='CASCADE'), nullable=False)
    notification_id = Column(UUID(as_uuid=True), ForeignKey('notifications.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(20), nullable=False, default='pending')
    attempts = Column(Integer, nullable=False, default=0)
    retry_at = Column(DateTime, nullable=False)
    ticket_id = Column(String(255), nullable=True)
    error = Column(String(100), nullable=True)
