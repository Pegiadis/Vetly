import base64


def test_mobile_pet_create_edit_photo(client, owner_auth_header, monkeypatch, tmp_path):
    from app.utils import upload
    monkeypatch.setattr(upload, 'UPLOAD_DIR', tmp_path)
    response = client.post('/api/v1/owner/pets', headers=owner_auth_header, json={
        'name': 'Mobile test', 'type': 'Dog', 'breed': 'Mixed',
        'age': 0, 'weight': 2.5, 'gender': 'Female',
    })
    assert response.status_code == 201, response.text
    pet_id = response.json()['id']
    response = client.put(f'/api/v1/owner/pets/{pet_id}', headers=owner_auth_header,
                          json={'name': 'Updated mobile', 'age': 1, 'weight': 3.5})
    assert response.status_code == 200, response.text
    assert response.json()['name'] == 'Updated mobile'
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4mQAAAAASUVORK5CYII=')
    path = f'/api/v1/uploads/pet/{pet_id}/photo'
    response = client.post(path, headers=owner_auth_header, files={'file': ('pet.png', png, 'image/png')})
    assert response.status_code == 200, response.text
    url = response.json()['url']
    stored = tmp_path / url.removeprefix('/uploads/')
    assert stored.exists()
    rejected = client.post(path, headers=owner_auth_header, files={'file': ('bad.txt', b'bad', 'text/plain')})
    assert rejected.status_code == 400
    assert stored.exists(), 'A rejected replacement must retain the existing photo'
    items = client.get('/api/v1/owner/pets?page_size=50', headers=owner_auth_header).json()['items']
    pet = next(p for p in items if p['id'] == pet_id)
    assert pet['image_url'] == url
    assert pet['weight'] == 3.5
