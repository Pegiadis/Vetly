"""The public vet profile must not expose private account fields."""

from tests.conftest import VET_DATA


def test_public_profile_hides_license_and_email(client, registered_vet):
    for key in (str(registered_vet.id), registered_vet.slug):
        response = client.get(f"/api/v1/public/vets/{key}")
        assert response.status_code == 200
        body = response.json()
        assert body["name"] == registered_vet.name
        assert "license_number" not in body
        assert "email" not in body
        raw = response.text
        assert VET_DATA["license_number"] not in raw
        assert VET_DATA["email"] not in raw
