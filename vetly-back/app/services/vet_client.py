"""
Vet client management service
"""

import secrets
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.base import PetOwner
from app.core.email import send_email
from app.core.security import get_password_hash
from app.models.pet import Pet, PetType, Gender
from app.models.vet_client import VetClient, VetClientPet
from app.repositories.pet import PetRepository
from app.repositories.vet_client import VetClientRepository
from app.services.notification import NotificationService
from app.schemas.auth import RegisterResponse
from app.schemas.vet_client import (
    InviteInfoResponse,
    InviteLinkResponse,
    InviteRegisterRequest,
    LinkedPetResponse,
    VetClientCreateRequest,
    VetClientListItem,
    VetClientListResponse,
    VetClientPetCreateRequest,
    VetClientPetResponse,
    VetClientPetUpdateRequest,
    VetClientResponse,
    VetClientUpdateRequest,
)


INVITE_EXPIRY_DAYS = 7


def _build_invite_email_html(vet_name: str, invite_url: str) -> str:
    """Build the HTML email that invites a clinic client to open an account."""
    from html import escape

    from app.core.email_layout import button, email_shell, paragraph

    body = (
        paragraph(
            f"<strong>{escape(vet_name)}</strong> σας προσκαλεί στο Vetly. Δημιουργήστε λογαριασμό για να "
            "διαχειρίζεστε τα ραντεβού και το ιστορικό υγείας του κατοικιδίου σας."
        )
        + button(invite_url, "Εγγραφή στο Vetly")
    )
    return email_shell("Πρόσκληση στο Vetly", body)


class VetClientService:
    """Service for vet client management"""

    def __init__(self, db: Session):
        self.db = db
        self.repo = VetClientRepository(db)
        self.notifications = NotificationService(db)

    def list_clients(self, vet_id: UUID, search: str | None, page: int, page_size: int) -> VetClientListResponse:
        self.repo.sync_appointment_owners(vet_id)

        skip = (page - 1) * page_size
        clients, total = self.repo.get_by_vet(vet_id, search=search, skip=skip, limit=page_size)
        items = []
        for c in clients:
            pet_count = len(self.db.scalars(select(Pet).where(
                Pet.pet_owner_id == c.pet_owner_id, PetRepository.access_filter(vet_id))).all())
            owner_image = c.pet_owner.image_url if c.pet_owner_id and c.pet_owner else None
            items.append(VetClientListItem(
                id=c.id,
                name=c.name,
                email=c.email,
                phone=c.phone,
                image_url=owner_image,
                status=c.status,
                pet_count=pet_count,
                created_at=c.created_at,
            ))
        return VetClientListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_client(self, client_id: UUID, vet_id: UUID) -> VetClientResponse:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        response = VetClientResponse.model_validate(client)

        response.pets = [VetClientPetResponse.model_validate(p) for p in client.pets if not p.clinical_pet.deleted_at]
        response.linked_pets = [LinkedPetResponse.model_validate(p) for p in self.db.scalars(
            select(Pet).where(Pet.pet_owner_id == client.pet_owner_id, PetRepository.access_filter(vet_id))).all()]

        return response

    def create_client(self, vet_id: UUID, data: VetClientCreateRequest) -> VetClientResponse:
        if data.email:
            existing = self.repo.get_by_email_for_vet(vet_id, data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A client with this email already exists",
                )
        client = self.repo.create(
            vet_id=vet_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            address=data.address,
            notes=data.notes,
        )
        return VetClientResponse.model_validate(client)

    def update_client(self, client_id: UUID, vet_id: UUID, data: VetClientUpdateRequest) -> VetClientResponse:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        update_data = data.model_dump(exclude_unset=True)

        # If email is being changed, check for duplicates
        if "email" in update_data and update_data["email"]:
            existing = self.repo.get_by_email_for_vet(vet_id, update_data["email"])
            if existing and existing.id != client_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A client with this email already exists",
                )

        self.repo.update(client, **update_data)
        return VetClientResponse.model_validate(client)

    def delete_client(self, client_id: UUID, vet_id: UUID) -> None:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        from app.models.appointment import Appointment
        if client.pets or self.db.scalar(select(Appointment.id).where(
            Appointment.vet_id == vet_id, Appointment.pet_owner_id == client.pet_owner_id).limit(1)):
            raise HTTPException(409, 'Η καρτέλα έχει κατοικίδια ή ιστορικό και δεν μπορεί να διαγραφεί.')
        self.repo.delete(client)

    # --- Invite ---

    def generate_invite(self, client_id: UUID, vet_id: UUID, base_url: str) -> InviteLinkResponse:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        if client.status == "linked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client already has a Vetly account",
            )

        if not client.email:
            raise HTTPException(400, 'Προσθέστε email στην καρτέλα πριν στείλετε πρόσκληση.')
        token = secrets.token_hex(32)
        expires_at = datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS)

        self.repo.update(client, invite_token=token, invite_expires_at=expires_at, status="invited")

        invite_url = f"{base_url}/invite/{token}"

        # Send invite email
        if client.email:
            vet_name = client.vet.name if client.vet else "Ο κτηνίατρός σας"
            html = _build_invite_email_html(vet_name, invite_url)
            send_email(client.email, "Πρόσκληση στο Vetly", html)

        return InviteLinkResponse(invite_url=invite_url, expires_at=expires_at)

    def resend_invite(self, client_id: UUID, vet_id: UUID, base_url: str) -> InviteLinkResponse:
        """Resend an invite by generating a new token for an existing client"""
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        if client.status == "linked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client already has a Vetly account",
            )
        if client.status != "invited":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client has not been invited yet. Use the invite endpoint first.",
            )

        if not client.email:
            raise HTTPException(400, 'Προσθέστε email στην καρτέλα πριν στείλετε πρόσκληση.')
        token = secrets.token_hex(32)
        expires_at = datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS)

        self.repo.update(client, invite_token=token, invite_expires_at=expires_at)

        invite_url = f"{base_url}/invite/{token}"

        # Send invite email
        if client.email:
            vet_name = client.vet.name if client.vet else "Ο κτηνίατρός σας"
            html = _build_invite_email_html(vet_name, invite_url)
            send_email(client.email, "Πρόσκληση στο Vetly", html)

        return InviteLinkResponse(invite_url=invite_url, expires_at=expires_at)

    def get_invite_info(self, token: str) -> InviteInfoResponse:
        client = self.repo.get_by_invite_token(token)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite link")
        if client.invite_expires_at and client.invite_expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite link has expired")
        if client.status == "linked":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already used")

        return InviteInfoResponse(
            vet_name=client.vet.name if client.vet else "Κτηνίατρος",
            client_name=client.name,
            client_email=client.email,
        )

    def register_via_invite(self, token: str, data: InviteRegisterRequest) -> RegisterResponse:
        from app.core.pilot import require_pilot_access
        from app.core.legal import consent_fields
        require_pilot_access(data.email)
        consent = consent_fields(data.accept_terms)
        client = self.repo.get_by_invite_token(token)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite link")
        if client.invite_expires_at and client.invite_expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite link has expired")
        if client.status == "linked":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already used")

        if data.email.casefold() != (client.email or "").casefold():
            raise HTTPException(400, "Το email πρέπει να αντιστοιχεί στην πρόσκληση.")

        # The email is already pinned to the invite, so this can only ever reveal the
        # invitee's own address. Even so the answer matches a fresh registration, the
        # same as the open register form: a verified account is told by email and is
        # claimed by signing in and accepting the invite; the account is left untouched.
        existing = self.db.scalar(
            select(PetOwner).where(func.lower(PetOwner.email) == data.email.casefold()).with_for_update()
        )
        response = RegisterResponse(email=data.email, message="Ελέγξτε το email σας για επιβεβαίωση.")
        if existing and (existing.email_verified or not existing.password_hash):
            if existing.email_verified:
                from app.services.auth import _send_already_registered_email
                _send_already_registered_email(data.email, "pet_owner")
            return response

        if existing:
            # Unverified registration for the invited address: replaced, so it cannot
            # block the invite. The claim still happens only after email verification.
            existing.password_hash = get_password_hash(data.password)
            existing.auth_version += 1
            existing.name = data.name
            existing.phone = data.phone
            existing.address = data.address
            existing.terms_accepted_at = consent["terms_accepted_at"]
            existing.terms_version = consent["terms_version"]
            pet_owner = existing
        else:
            pet_owner = PetOwner(
                email=data.email,
                password_hash=get_password_hash(data.password),
                name=data.name,
                phone=data.phone,
                address=data.address,
                email_verified=False,
                **consent,
            )
            self.db.add(pet_owner)
        self.db.flush()

        if client.pet_owner_id is None:
            clinic_owner = PetOwner(name=client.name, phone=client.phone, address=client.address)
            self.db.add(clinic_owner)
            self.db.flush()
            client.pet_owner_id = clinic_owner.id
        # Retain the clinic identity until the new owner proves access to the email.
        client.pending_owner_id = pet_owner.id
        self.db.commit()
        self.db.refresh(pet_owner)

        from app.core.security import create_email_verification_token
        from app.core.email import send_verification_email
        verification = create_email_verification_token(str(pet_owner.id), "pet_owner")
        send_verification_email(pet_owner.email, verification, "pet_owner")
        return RegisterResponse(email=pet_owner.email, message="Ελέγξτε το email σας για επιβεβαίωση.")

    def accept_invite(self, token: str, owner: PetOwner) -> dict:
        client = self.repo.get_by_invite_token(token)
        if not client:
            raise HTTPException(404, 'Η πρόσκληση δεν βρέθηκε ή έχει ήδη χρησιμοποιηθεί.')
        from app.services.client_claim import claim_client
        claim_client(self.db, client, owner)
        self.db.commit()
        return {"message": "Η καρτέλα και το ιστορικό συνδέθηκαν με τον λογαριασμό σας."}

    # --- Pets ---

    def add_pet(self, client_id: UUID, vet_id: UUID, data: VetClientPetCreateRequest) -> VetClientPetResponse:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        pet = self.repo.add_pet(
            vet_client_id=client.id,
            name=data.name,
            pet_type=PetType(data.type),
            breed=data.breed,
            age=data.age,
            weight=data.weight,
            gender=Gender(data.gender) if data.gender else None,
            notes=data.notes,
        )
        return VetClientPetResponse.model_validate(pet)

    def update_pet(self, client_id: UUID, vet_id: UUID, pet_id: UUID,
                   data: VetClientPetUpdateRequest) -> VetClientPetResponse:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        if client.status == 'linked':
            raise HTTPException(409, 'Το κατοικίδιο έχει συνδεθεί με τον κηδεμόνα του.')

        pet = self.repo.get_pet(pet_id, client.id)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

        update_data = data.model_dump(exclude_unset=True)
        if "type" in update_data and update_data["type"]:
            update_data["type"] = PetType(update_data["type"])
        if "gender" in update_data and update_data["gender"]:
            update_data["gender"] = Gender(update_data["gender"])

        updated = self.repo.update_pet(pet, **update_data)
        return VetClientPetResponse.model_validate(updated)

    def delete_pet(self, client_id: UUID, vet_id: UUID, pet_id: UUID) -> None:
        client = self.repo.get_by_id_for_vet(client_id, vet_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        if client.status == 'linked':
            raise HTTPException(409, 'Το κατοικίδιο έχει συνδεθεί με τον κηδεμόνα του.')

        pet = self.repo.get_pet(pet_id, client.id)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

        self.repo.delete_pet(pet)
