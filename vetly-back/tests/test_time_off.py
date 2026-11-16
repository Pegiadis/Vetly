"""Tests for vet time off / closures."""

import uuid
from datetime import datetime, timedelta

from app.db.base import Appointment
from app.models.appointment import AppointmentStatus
from tests.test_appointments import (
    API, WEEKDAY_HOURS, _make_owner, _make_pet, _make_vet, _next_weekday_at,
    _owner_headers, _vet_headers,
)


def _setup(db):
    vet = _make_vet(db, hours=WEEKDAY_HOURS)
    owner = _make_owner(db)
    pet = _make_pet(db, owner.id)
    return vet, owner, pet


def _closure(client, vet, day, **extra):
    body = {"start_date": day.date().isoformat(), "end_date": day.date().isoformat(), **extra}
    return client.post(f"{API}/vet/time-off", json=body, headers=_vet_headers(vet))


def _slots(client, vet, owner, day):
    r = client.get(f"{API}/vets/{vet.id}/available-slots?date={day.date().isoformat()}",
                   headers=_owner_headers(owner))
    assert r.status_code == 200
    return r.json()["slots"]


def _book(client, vet, owner, pet, when):
    return client.post(f"{API}/owner/appointments", headers=_owner_headers(owner), json={
        "vet_id": str(vet.id), "pet_id": str(pet.id), "type": "Checkup",
        "scheduled_at": when.isoformat(), "duration_minutes": 30,
    })


def test_whole_day_closure_removes_slots_and_blocks_booking(client, db):
    vet, owner, pet = _setup(db)
    day = _next_weekday_at(10, 0, weekday=1)
    assert _slots(client, vet, owner, day)
    r = _closure(client, vet, day, reason="Διακοπές")
    assert r.status_code == 201
    assert _slots(client, vet, owner, day) == []
    blocked = _book(client, vet, owner, pet, day)
    assert blocked.status_code == 400
    assert "κλειστό" in blocked.json()["detail"]


def test_partial_closure_blocks_only_its_window(client, db):
    vet, owner, pet = _setup(db)
    day = _next_weekday_at(10, 0, weekday=2)
    assert _closure(client, vet, day, start_time="12:00:00", end_time="14:00:00").status_code == 201
    slots = _slots(client, vet, owner, day)
    assert "11:30" in slots and "12:00" not in slots and "13:30" not in slots and "14:00" in slots
    assert _book(client, vet, owner, pet, day.replace(hour=12)).status_code == 400
    assert _book(client, vet, owner, pet, day.replace(hour=14)).status_code == 201


def test_create_lists_affected_appointments(client, db):
    vet, owner, pet = _setup(db)
    day = _next_weekday_at(10, 0, weekday=3)
    assert _book(client, vet, owner, pet, day).status_code == 201
    r = _closure(client, vet, day)
    assert r.status_code == 201
    affected = r.json()["affected_appointments"]
    assert len(affected) == 1 and affected[0]["pet_name"] == pet.name


def test_vet_create_reschedule_and_approve_are_rejected_in_closure(client, db):
    vet, owner, pet = _setup(db)
    day = _next_weekday_at(10, 0, weekday=1)
    other = day + timedelta(days=1)
    pending = _book(client, vet, owner, pet, other).json()
    assert _closure(client, vet, other).status_code == 201
    h = _vet_headers(vet)
    approve = client.post(f"{API}/vet/appointments/{pending['id']}/approve", headers=h)
    assert approve.status_code == 400
    created = client.post(f"{API}/vet/appointments", headers=h, json={
        "pet_id": str(pet.id), "scheduled_at": other.isoformat(), "duration_minutes": 30, "type": "Checkup",
    })
    assert created.status_code == 400
    ok = _book(client, vet, owner, pet, day).json()
    moved = client.post(f"{API}/vet/appointments/{ok['id']}/reschedule", headers=h,
                       json={"scheduled_at": other.isoformat()})
    assert moved.status_code == 400


def test_delete_reopens_day_and_is_scoped_to_vet(client, db):
    vet, owner, pet = _setup(db)
    stranger = _make_vet(db, hours=WEEKDAY_HOURS)
    day = _next_weekday_at(10, 0, weekday=4)
    entry = _closure(client, vet, day).json()
    assert client.delete(f"{API}/vet/time-off/{entry['id']}", headers=_vet_headers(stranger)).status_code == 404
    assert client.delete(f"{API}/vet/time-off/{entry['id']}", headers=_vet_headers(vet)).status_code == 204
    assert _slots(client, vet, owner, day)
    assert client.get(f"{API}/vet/time-off", headers=_vet_headers(vet)).json() == []


def test_validation_and_closed_dates(client, db):
    vet, owner, _ = _setup(db)
    day = _next_weekday_at(10, 0, weekday=0)
    bad = client.post(f"{API}/vet/time-off", headers=_vet_headers(vet), json={
        "start_date": (day + timedelta(days=2)).date().isoformat(), "end_date": day.date().isoformat()})
    assert bad.status_code == 422
    r = client.post(f"{API}/vet/time-off", headers=_vet_headers(vet), json={
        "start_date": day.date().isoformat(), "end_date": (day + timedelta(days=2)).date().isoformat()})
    assert r.status_code == 201
    closed = client.get(
        f"{API}/vets/{vet.id}/closed-dates?from={day.date()}&to={(day + timedelta(days=4)).date()}",
        headers=_owner_headers(owner)).json()["closed_dates"]
    assert closed == [(day + timedelta(days=i)).date().isoformat() for i in range(3)]
