"""PDF documents: readable Greek, text that wraps, and markup-safe user text."""
from datetime import date

import pytest

from app.core.security import create_access_token
from app.db.base import MedicalEvent
from app.models.appointment import AppointmentStatus
from app.services import document

from tests.test_billing_and_completion import _appointment, world  # noqa: F401

API = "/api/v1/vet/documents"


def _headers(vet):
    return {"Authorization": f"Bearer {create_access_token(str(vet.id), token_type='vet', version=vet.auth_version)}"}


@pytest.fixture()
def treated(db, world):
    """A vet with a completed visit for the pet, so the documents are available."""
    vet, owner, pet = world
    _appointment(db, vet, owner, pet, status=AppointmentStatus.COMPLETED)
    return vet, owner, pet


def test_medical_record_embeds_a_font_with_greek(client, db, treated):
    vet, _, pet = treated
    db.add(MedicalEvent(pet_id=pet.id, vet_id=vet.id, date=date.today(), title="Ετήσιος έλεγχος", event_type="Εξέταση"))
    db.commit()
    response = client.get(f"{API}/medical-record/{pet.id}", headers=_headers(vet))
    assert response.status_code == 200, response.text
    assert response.content.startswith(b"%PDF")
    # The standard PDF fonts have no Greek: a TrueType font must be embedded.
    assert b"/FontFile2" in response.content


def test_user_text_with_markup_characters_does_not_break_the_document(client, db, treated):
    vet, owner, pet = treated
    pet.name = "Ρεξ <b>& Co"
    owner.name = "Μαρία <Παπαδοπούλου>"
    db.add(MedicalEvent(pet_id=pet.id, vet_id=vet.id, date=date.today(), title="Βάρος < 5kg & πυρετός",
                        notes="Θερμοκρασία > 39 <br> επανέλεγχος", event_type="Εμβολιασμός"))
    db.commit()
    for path in ("medical-record", "vaccination-certificate"):
        response = client.get(f"{API}/{path}/{pet.id}", headers=_headers(vet))
        assert response.status_code == 200, (path, response.text)
        assert response.content.startswith(b"%PDF")


def test_without_a_greek_font_the_request_fails_instead_of_printing_squares(client, treated, monkeypatch):
    vet, _, pet = treated
    monkeypatch.setattr(document, "_FONT_REGISTERED", False)
    monkeypatch.setattr(document, "_FONT_CANDIDATES", [])
    response = client.get(f"{API}/medical-record/{pet.id}", headers=_headers(vet))
    assert response.status_code == 503
    assert "δεν είναι διαθέσιμη" in response.json()["detail"]


def test_species_and_gender_are_shown_in_greek():
    class Value:
        def __init__(self, value):
            self.value = value

    class FakePet:
        type = Value("Dog")
        gender = Value("Female")

    assert document._species(FakePet()) == "Σκύλος"
    assert document._gender(FakePet()) == "Θηλυκό"
