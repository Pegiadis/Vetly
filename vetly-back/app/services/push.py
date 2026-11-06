"""Generate due medication notices and deliver existing owner notices through Expo."""
from datetime import datetime, timedelta
import httpx
from sqlalchemy import select, exists
from sqlalchemy.dialects.postgresql import insert
from app.core.config import settings
from app.db.base import Medication, Notification, Pet, PetOwner
from app.models.push import PushDevice, PushDelivery
from app.services.scheduling import ATHENS

PUSH_TYPES = ('appointment_confirm', 'appointment_reject', 'appointment_cancel', 'appointment_reschedule', 'appointment_reminder', 'reminder', 'medication')

def medication_due(medication, now):
    today = now.date()
    if not medication.is_active or today < medication.start_date or (medication.end_date and today > medication.end_date):
        return False
    frequency = getattr(medication.frequency, 'value', medication.frequency)
    days = (today - medication.start_date).days
    if frequency == 'once' and days != 0 or frequency == 'weekly' and days % 7 != 0:
        return False
    if frequency not in ('once', 'weekly', 'daily'):
        return False
    scheduled = datetime.combine(today, medication.time, tzinfo=ATHENS)
    return timedelta(0) <= now - scheduled < timedelta(minutes=15)

def create_medication_notifications(db, now=None):
    now = now or datetime.now(ATHENS)
    meds = db.scalars(select(Medication).join(Pet).where(Medication.is_active.is_(True), Pet.deleted_at.is_(None))).all()
    count = 0
    for med in meds:
        if not medication_due(med, now):
            continue
        result = db.execute(insert(Notification).values(
            pet_owner_id=med.pet.pet_owner_id, type='medication', title='Υπενθύμιση φαρμάκου',
            message=f'{med.pet.name}: {med.name} · {med.dosage} · {med.time.strftime("%H:%M")}. Ακολούθησε τις οδηγίες του κτηνιάτρου.',
            is_read=False, source_key=f'medication:{med.id}:{now.date().isoformat()}:{med.time.isoformat()}'
        ).on_conflict_do_nothing(index_elements=['source_key']))
        count += result.rowcount
    db.commit()
    return count

def queue_push(db, now):
    pairs = db.execute(select(PushDevice.id, Notification.id).join(PetOwner, PushDevice.owner_id == PetOwner.id)
        .join(Notification, Notification.pet_owner_id == PushDevice.owner_id)
        .where(PushDevice.enabled.is_(True), PushDevice.auth_version == PetOwner.auth_version,
            PushDevice.last_seen_at > now - timedelta(days=30), Notification.created_at >= PushDevice.registered_at,
            Notification.created_at > now - timedelta(hours=24), Notification.type.in_(PUSH_TYPES),
            ~exists(select(PushDelivery.id).where(PushDelivery.device_id == PushDevice.id, PushDelivery.notification_id == Notification.id)))
        .order_by(Notification.created_at).limit(500)).all()
    for device_id, notification_id in pairs:
        db.execute(insert(PushDelivery).values(device_id=device_id, notification_id=notification_id,
            status='pending', attempts=0, retry_at=now).on_conflict_do_nothing(constraint='uq_push_delivery'))
    db.commit()

def device_is_current(device, owner, notification, now):
    return device and owner and device.enabled and device.owner_id == notification.pet_owner_id and device.auth_version == owner.auth_version and device.registered_at <= notification.created_at and device.last_seen_at > now-timedelta(days=30)

def expo_call(client, endpoint, body):
    headers = {'Authorization': f'Bearer {settings.EXPO_ACCESS_TOKEN}'} if settings.EXPO_ACCESS_TOKEN else {}
    response = client.post(f'https://exp.host/--/api/v2/push/{endpoint}', json=body, headers=headers)
    response.raise_for_status()
    payload = response.json()
    if 'data' not in payload:
        raise ValueError('Missing Expo response data')
    return payload['data']

def retry(delivery, now, reason):
    delivery.error = reason[:100]
    delivery.attempts += 1
    delivery.status = 'failed' if delivery.attempts >= 6 else 'pending'
    delivery.retry_at = now + timedelta(seconds=min(3600, 60 * 2 ** delivery.attempts))

def process_push(db, client=None, now=None):
    if not settings.PUSH_NOTIFICATIONS_ENABLED:
        return 0
    now = now or datetime.utcnow()
    queue_push(db, now)
    own_client = client is None
    client = client or httpx.Client(timeout=10)
    count = 0
    try:
        deliveries = db.scalars(select(PushDelivery).where(PushDelivery.status.in_(('pending', 'ticket')), PushDelivery.retry_at <= now)
            .order_by(PushDelivery.retry_at).limit(100).with_for_update(skip_locked=True)).all()
        for delivery in deliveries:
            device = db.get(PushDevice, delivery.device_id)
            note = db.get(Notification, delivery.notification_id)
            owner = db.get(PetOwner, device.owner_id) if device else None
            if not note or not device_is_current(device, owner, note, now):
                delivery.status = 'cancelled'
                continue
            if delivery.status == 'pending' and (note.created_at < now-timedelta(hours=24) or (note.type=='medication' and note.created_at < now-timedelta(minutes=15))):
                delivery.status = 'expired'
                continue
            try:
                if delivery.status == 'ticket':
                    receipt = expo_call(client, 'getReceipts', {'ids': [delivery.ticket_id]}).get(delivery.ticket_id)
                    if not receipt:
                        if note.created_at < now-timedelta(hours=24):
                            delivery.status = 'receipt_missing'
                        else:
                            delivery.retry_at = now+timedelta(minutes=15)
                        continue
                    result = receipt
                else:
                    # Keep lock-screen text generic. Full medical details require an authenticated session.
                    result = expo_call(client, 'send', {'to': device.token, 'sound': 'default', 'channelId': 'vetly-care',
                        'title': 'Vetly', 'body': 'Έχεις νέα ενημέρωση για ραντεβού.' if note.type.startswith('appointment') else 'Έχεις νέα υπενθύμιση φροντίδας.',
                        'ttl': 900 if note.type=='medication' else 3600,
                        'data': {'ownerId': str(owner.id), 'notificationId': str(note.id), 'destination': 'visits' if note.type.startswith('appointment') else 'care'}})
                if result.get('status') == 'ok':
                    if delivery.status == 'ticket':
                        delivery.status = 'delivered'
                    elif result.get('id'):
                        delivery.ticket_id = result['id']; delivery.status = 'ticket'; delivery.retry_at = now+timedelta(minutes=15); count += 1
                    else:
                        retry(delivery, now, 'MissingTicket')
                else:
                    reason = result.get('details', {}).get('error', 'ExpoError')
                    if reason == 'DeviceNotRegistered':
                        device.enabled = False; delivery.status = 'failed'; delivery.error = reason
                    elif reason in ('MessageRateExceeded', 'ExpoError') and delivery.status != 'ticket':
                        retry(delivery, now, reason)
                    else:
                        delivery.status = 'failed'; delivery.error = reason
            except (httpx.HTTPError, ValueError, KeyError, TypeError):
                if delivery.status == 'ticket':
                    delivery.retry_at = now+timedelta(minutes=15)
                    if note.created_at < now-timedelta(hours=24): delivery.status = 'receipt_missing'
                else:
                    retry(delivery, now, 'TransportError')
        db.commit()
    finally:
        if own_client: client.close()
    return count
