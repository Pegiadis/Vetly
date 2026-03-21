"""
Test configuration and fixtures for Vetly backend tests.

Uses the real PostgreSQL database with transaction rollback per test
so no test data persists.
"""

import uuid

import pytest
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

from app.db.session import engine
from app.db.base_class import Base
# Import all models so they are registered with Base.metadata
from app.db.base import (  # noqa: F401
    PetOwner, Vet, Pet, MedicalEvent, WeightHistory, Medication,
    Appointment, Review, Notification, BlogPost, VetClient, VetClientPet,
    ChatConversation, ChatMessage, ServiceType, Reminder,
)
from app.core.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def db():
    """Yield a DB session that rolls back after each test.

    Uses a nested transaction (SAVEPOINT) so that commits inside service
    code don't actually persist – the outer transaction is rolled back at
    the end of each test.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Start a SAVEPOINT; when the service calls session.commit() it will
    # release this savepoint. We restart a new nested transaction after
    # each commit so subsequent operations still run inside a savepoint.
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(session, transaction_inner):
        nonlocal nested
        if transaction_inner.nested and not transaction_inner.parent.nested:
            nested = connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """FastAPI TestClient wired to use the test DB session."""

    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper data
# ---------------------------------------------------------------------------

OWNER_DATA = {
    "email": "owner@test.com",
    "password": "test123456",
    "name": "Test Owner",
    "phone": "6900000000",
    "address": "Athens 123",
}

VET_DATA = {
    "email": "vet@test.com",
    "password": "test123456",
    "name": "Dr Test Vet",
    "specialty": "General Practice",
    "license_number": "VET-TEST-12345",
    "phone": "6900000001",
    "address": "Athens 456",
    "city": "Athens",
}


@pytest.fixture()
def registered_owner(db):
    """Create a pet owner directly in the DB with email already verified."""
    owner = PetOwner(
        email=OWNER_DATA["email"],
        password_hash=get_password_hash(OWNER_DATA["password"]),
        name=OWNER_DATA["name"],
        phone=OWNER_DATA["phone"],
        address=OWNER_DATA["address"],
        email_verified=True,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner


@pytest.fixture()
def registered_vet(db):
    """Create a vet directly in the DB with email already verified."""
    vet = Vet(
        email=VET_DATA["email"],
        password_hash=get_password_hash(VET_DATA["password"]),
        name=VET_DATA["name"],
        slug=f"dr-test-vet-{uuid.uuid4().hex[:6]}",
        specialty=VET_DATA["specialty"],
        license_number=VET_DATA["license_number"],
        phone=VET_DATA["phone"],
        address=VET_DATA["address"],
        city=VET_DATA["city"],
        is_verified=True,
        is_on_call=False,
        email_verified=True,
    )
    db.add(vet)
    db.commit()
    db.refresh(vet)
    return vet


@pytest.fixture()
def owner_token(registered_owner):
    """Return a valid JWT for the registered owner."""
    return create_access_token(subject=str(registered_owner.id), token_type="pet_owner")


@pytest.fixture()
def vet_token(registered_vet):
    """Return a valid JWT for the registered vet."""
    return create_access_token(subject=str(registered_vet.id), token_type="vet")


@pytest.fixture()
def owner_auth_header(owner_token):
    """Authorization header dict for the registered owner."""
    return {"Authorization": f"Bearer {owner_token}"}


@pytest.fixture()
def vet_auth_header(vet_token):
    """Authorization header dict for the registered vet."""
    return {"Authorization": f"Bearer {vet_token}"}
