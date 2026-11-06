from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4
import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from app.services.vet_assistant import VetAssistantService
from app.api.v1.endpoints.vet_chat import PatientDraftRequest


def service():
    s = VetAssistantService(Mock())
    s.pets = Mock()
    s.pets.get_patient.return_value.model_dump.return_value = {'id': 'pet', 'name': 'Luna'}
    event = SimpleNamespace(model_dump=Mock(return_value={'id':'event','date':'2026-10-20','title':'Εξέταση','notes':'record'}))
    s.pets.get_patient_history.return_value = SimpleNamespace(items=[event], total=61)
    s.chat = Mock()
    s.chat._generate_response.return_value = 'Προσχέδιο'
    return s


def test_scoped_context_without_owner_contact_or_other_conversation():
    s = service()
    vet, pet = uuid4(), uuid4()
    result = s.draft(vet, pet, 'summary', '')
    s.pets.get_patient.assert_called_once_with(pet_id=pet, vet_id=vet)
    s.pets.get_patient_history.assert_called_once_with(pet_id=pet, vet_id=vet, page=1, page_size=50)
    assert 'owner' not in s.pets.get_patient.return_value.model_dump.call_args.kwargs['include']
    assert result['total_events'] == 61
    args = s.chat._generate_response.call_args.args
    assert args[0] == []
    assert 'Luna' in args[1] and 'record' in args[1]


def test_denied_patient_never_reaches_provider():
    s = service()
    s.pets.get_patient.side_effect = HTTPException(404, 'Patient not found')
    with pytest.raises(HTTPException) as e:
        s.draft(uuid4(), uuid4(), 'summary', '')
    assert e.value.status_code == 404
    s.chat._generate_response.assert_not_called()
    s.pets.get_patient_history.assert_not_called()


@pytest.mark.parametrize('task,notes,empty', [('instructions','   ',False),('summary','',True)])
def test_missing_data_prevents_generation(task, notes, empty):
    s = service()
    if empty: s.pets.get_patient_history.return_value.items = []
    with pytest.raises(HTTPException) as e:
        s.draft(uuid4(), uuid4(), task, notes)
    assert e.value.status_code == 422
    s.chat._generate_response.assert_not_called()


def test_provider_unavailable():
    s = service()
    s.chat._generate_response.return_value = None
    with pytest.raises(HTTPException) as e:
        s.draft(uuid4(), uuid4(), 'instructions', 'Οδηγίες')
    assert e.value.status_code == 503


def test_request_limits():
    for data in [{'task':'diagnose'}, {'task':'instructions','notes':'x'*5001}]:
        with pytest.raises(ValidationError):
            PatientDraftRequest(pet_id=uuid4(), **data)
