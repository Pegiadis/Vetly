def test_on_call_list_tracks_verified_vet_availability(client, db, registered_vet):
    vet=registered_vet
    vet.coordinates_lat=37.98
    vet.coordinates_lng=23.72
    vet.phone='+30 210 1234567'
    vet.is_on_call=True
    vet.is_verified=True
    db.commit()
    response=client.get('/api/v1/vets/on-call')
    assert response.status_code==200
    record=next(v for v in response.json()['items'] if v['id']==str(vet.id))
    assert record['phone']==vet.phone
    assert float(record['coordinates_lat'])==37.98
    assert float(record['coordinates_lng'])==23.72
    vet.is_on_call=False
    db.commit()
    assert str(vet.id) not in {v['id'] for v in client.get('/api/v1/vets/on-call').json()['items']}
    vet.is_on_call=True
    vet.is_verified=False
    db.commit()
    assert str(vet.id) not in {v['id'] for v in client.get('/api/v1/vets/on-call').json()['items']}
