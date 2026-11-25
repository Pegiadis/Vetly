"""The assistant addresses owners in the singular and clinics in the polite plural, like each app does."""
from app.services.chat import ChatService


def test_owner_prompt_asks_for_the_singular(db, registered_owner):
    prompt = ChatService(db)._build_system_prompt(pet_owner_id=registered_owner.id)
    assert "στον ενικό" in prompt and "πληθυντικό ευγενείας, επαγγελματικά" not in prompt


def test_vet_prompt_asks_for_the_polite_plural(db, registered_vet):
    prompt = ChatService(db)._build_system_prompt(vet_id=registered_vet.id)
    assert "πληθυντικό ευγενείας, επαγγελματικά" in prompt and "στον ενικό, φιλικά" not in prompt
