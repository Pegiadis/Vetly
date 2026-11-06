from datetime import date
from uuid import uuid4
from app.db.base import MedicalEvent, Pet, PetOwner


def test_owner_history_filters_paginates_and_keeps_vet_instructions(client, db, registered_owner, registered_vet, owner_auth_header):
    pet = Pet(pet_owner_id=registered_owner.id, name='History test', type='Dog', breed='Mixed', age=2, weight=5, gender='Male')
    db.add(pet)
    db.flush()
    instructions = 'Οδηγίες κτηνιάτρου\nΕπανέλεγχος σύμφωνα με την επίσκεψη.'
    for day, kind, title in [(1, 'Checkup', 'Εξέταση'), (2, 'Vaccination', 'Εμβολιασμός'), (3, 'Lab Test', 'Εργαστηριακή εξέταση')]:
        db.add(MedicalEvent(pet_id=pet.id, vet_id=registered_vet.id, date=date(2026, 10, day), event_type=kind, title=title, notes=instructions))
    db.commit()
    url = f'/api/v1/owner/pets/{pet.id}/medical-history'
    response = client.get(url, params={'page': 1, 'page_size': 2}, headers=owner_auth_header)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['total'] == 3
    assert [e['date'] for e in body['items']] == ['2026-10-03', '2026-10-02']
    assert body['items'][0]['notes'] == instructions
    assert body['items'][0]['vet']['name'] == registered_vet.name
    second = client.get(url, params={'page': 2, 'page_size': 2}, headers=owner_auth_header).json()
    assert [e['event_type'] for e in second['items']] == ['Checkup']
    for kind in ('Vaccination', 'Lab Test'):
        filtered = client.get(url, params={'event_type': kind}, headers=owner_auth_header).json()
        assert filtered['total'] == 1
        assert filtered['items'][0]['event_type'] == kind
    empty = client.get(url, params={'event_type': 'Surgery'}, headers=owner_auth_header).json()
    assert empty['items'] == [] and empty['total'] == 0


def test_history_of_another_owner_is_not_visible(client, db, owner_auth_header):
    other = PetOwner(name='Other owner', email=f'{uuid4()}@example.com', password_hash='unused', email_verified=True)
    db.add(other)
    db.flush()
    pet = Pet(pet_owner_id=other.id, name='Private pet', type='Cat', breed='Mixed', age=1, weight=4, gender='Female')
    db.add(pet)
    db.commit()
    response = client.get(f'/api/v1/owner/pets/{pet.id}/medical-history', headers=owner_auth_header)
    assert response.status_code == 404
