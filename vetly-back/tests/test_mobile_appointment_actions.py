"""Owner mobile uses the web API: exercise the complete lifecycle without real emails."""
from uuid import uuid4
from sqlalchemy import select
from app.db.base import Appointment, Notification
from app.models.appointment import AppointmentStatus
from tests.test_appointments import _make_pet, _next_weekday_at, WEEKDAY_HOURS


def test_confirmed_visit_move_cancel_and_vet_notifications(client, db, registered_owner, registered_vet, owner_auth_header):
    registered_vet.hours = WEEKDAY_HOURS
    group = uuid4()
    original_time = _next_weekday_at(10, 0)
    visits = []
    for name in ['Mobile Pet', 'Sibling Pet']:
        pet = _make_pet(db, registered_owner.id, name=name)
        visit = Appointment(vet_id=registered_vet.id, pet_owner_id=registered_owner.id, pet_id=pet.id,
                            scheduled_at=original_time, duration_minutes=45, type='Checkup',
                            group_id=group, status=AppointmentStatus.CONFIRMED)
        db.add(visit)
        visits.append(visit)
    db.commit()
    selected, sibling = visits
    endpoint = f'/api/v1/owner/appointments/{selected.id}'
    moved_time = _next_weekday_at(14, 0)
    moved = client.patch(endpoint + '/reschedule', headers=owner_auth_header, json={'scheduled_at': moved_time.isoformat()})
    assert moved.status_code == 200, moved.text
    assert moved.json()['status'] == 'pending'
    assert moved.json()['duration_minutes'] == 45
    assert moved.json()['scheduled_at'] == moved_time.isoformat()
    db.refresh(sibling)
    assert sibling.status == AppointmentStatus.CONFIRMED and sibling.scheduled_at == original_time

    cancelled = client.post(endpoint + '/cancel', headers=owner_auth_header, json={})
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()['status'] == 'cancelled'
    upcoming = client.get('/api/v1/owner/appointments/upcoming', headers=owner_auth_header).json()
    assert str(selected.id) not in [item['id'] for item in upcoming]
    all_visits = client.get('/api/v1/owner/appointments', headers=owner_auth_header).json()['items']
    assert next(item for item in all_visits if item['id'] == str(selected.id))['status'] == 'cancelled'
    slots = client.get(f'/api/v1/vets/{registered_vet.id}/available-slots?date={moved_time.date()}&duration_minutes=45', headers=owner_auth_header).json()['slots']
    assert '14:00' in slots
    events = db.scalars(select(Notification).where(Notification.appointment_id == selected.id, Notification.vet_id == registered_vet.id)).all()
    assert {'appointment_reschedule', 'appointment_cancel'} <= {event.type for event in events}
    db.refresh(sibling)
    assert sibling.status == AppointmentStatus.CONFIRMED
