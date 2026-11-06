from datetime import date
from types import SimpleNamespace
from uuid import uuid4
from unittest.mock import Mock, patch
import pytest
from fastapi import HTTPException
from app.services.reminder import ReminderService
from app.schemas.reminder import ReminderCreateRequest


def test_update_pending_reminder_preserves_delivery_state():
    vet, pet, rid = uuid4(), uuid4(), uuid4()
    reminder = SimpleNamespace(pet_id=pet, is_sent=False, is_dismissed=False)
    db = Mock()
    db.scalar.return_value = reminder
    payload = ReminderCreateRequest(pet_id=pet, type='checkup', title='Review', message='Updated', due_date=date(2026,12,20), reminder_days_before=7)
    with patch('app.services.reminder._build_reminder_response', return_value='saved'):
        assert ReminderService(db).update_reminder(rid, vet, payload) == 'saved'
    assert reminder.reminder_date == date(2026,12,13)
    assert reminder.title == 'Review'
    assert not reminder.is_sent and not reminder.is_dismissed
    assert vet in db.scalar.call_args.args[0].compile().params.values()
    db.commit.assert_called_once()


@pytest.mark.parametrize('state,code', [('missing',404),('sent',409),('dismissed',409),('other_pet',400)])
def test_update_rejects_invalid_targets(state, code):
    pet=uuid4()
    db=Mock()
    db.scalar.return_value=None if state=='missing' else SimpleNamespace(pet_id=uuid4() if state=='other_pet' else pet,is_sent=state=='sent',is_dismissed=state=='dismissed')
    data=ReminderCreateRequest(pet_id=pet,type='checkup',due_date=date(2026,12,20))
    with pytest.raises(HTTPException) as exc:
        ReminderService(db).update_reminder(uuid4(),uuid4(),data)
    assert exc.value.status_code==code
    db.commit.assert_not_called()
