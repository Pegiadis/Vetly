"""Treatments stop being "active" once their end date has passed."""
from datetime import date, time, timedelta

from app.db.base import Medication
from app.models.medication import MedicationFrequency
from app.services.medication_cleanup import finish_ended_medications

from tests.test_billing_and_completion import world  # noqa: F401


def _medication(db, pet, end_date):
    medication = Medication(pet_id=pet.id, name="Αντιβίωση", dosage="1 δισκίο", frequency=MedicationFrequency.DAILY,
                            time=time(9, 0), start_date=date.today() - timedelta(days=10), end_date=end_date, is_active=True)
    db.add(medication)
    db.commit()
    return medication


def test_only_treatments_past_their_last_day_are_closed(db, world):
    _, _, pet = world
    ended = _medication(db, pet, date.today() - timedelta(days=1))
    last_day = _medication(db, pet, date.today())
    ongoing = _medication(db, pet, None)

    finish_ended_medications(db)

    for medication in (ended, last_day, ongoing):
        db.refresh(medication)
    assert ended.is_active is False
    assert last_day.is_active is True and ongoing.is_active is True
