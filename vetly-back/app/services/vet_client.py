"""
Vet client management service
"""

import secrets
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import PetOwner
from app.core.email import send_email
from app.core.security import create_access_token, get_password_hash
from app.models.pet import PetType, Gender
from app.repositories.vet_client import VetClientRepository
from app.services.notification import NotificationService
from app.schemas.auth import TokenResponse
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
    """Build HTML email for client invite using teal (owner) color scheme."""
    color = "#0d9488"
    color_light = "#f0fdfa"
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
      <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <div style="background:{color};padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">Vetly</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1e293b;margin:0 0 16px;">Πρόσκληση στο Vetly</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
            {vet_name} σας προσκαλεί στο Vetly. Δημιουργήστε λογαριασμό για να διαχειριστείτε
            τα ραντεβού και το ιστορικό υγείας του κατοικιδίου σας.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{invite_url}" style="display:inline-block;background:{color};color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              Εγγραφή στο Vetly
            </a>
          </div>
          <div style="margin-top:24px;padding:16px;background:{color_light};border-radius:8px;">
            <p style="color:#64748b;font-size:12px;margin:0;word-break:break-all;">
              Αν το κουμπί δεν λειτουργεί, αντιγράψτε αυτόν τον σύνδεσμο:<br>{invite_url}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """


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
            # For linked clients, count real pets from PetOwner
            if c.pet_owner_id and c.pet_owner:
                pet_count = len(c.pet_owner.pets) if c.pet_owner.pets else 0
            else:
                pet_count = len(c.pets) if c.pets else 0
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

        # For linked clients, include real Pet records from PetOwner
        if client.pet_owner_id and client.pet_owner:
            response.linked_pets = [
                LinkedPetResponse.model_validate(p)
                for p in client.pet_owner.pets
            ]

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

    def register_via_invite(self, token: str, data: InviteRegisterRequest) -> TokenResponse:
        client = self.repo.get_by_invite_token(token)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite link")
        if client.invite_expires_at and client.invite_expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite link has expired")
        if client.status == "linked":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already used")

        # Check email not taken
        existing = self.db.scalar(select(PetOwner).where(PetOwner.email == data.email))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create PetOwner
        pet_owner = PetOwner(
            email=data.email,
            password_hash=get_password_hash(data.password),
            name=data.name,
            phone=data.phone,
            address=data.address,
            email_verified=False,
        )
        self.db.add(pet_owner)
        self.db.flush()

        # Link client
        self.repo.update(
            client,
            pet_owner_id=pet_owner.id,
            status="linked",
            invite_token=None,
            invite_expires_at=None,
        )

        self.db.commit()
        self.db.refresh(pet_owner)

        # Notify vet that client accepted the invite
        self.notifications.notify_vet(
            client.vet_id,
            type="client",
            title="Νέος πελάτης",
            message=f"Ο {data.name} αποδέχτηκε την πρόσκλησή σας και δημιούργησε λογαριασμό",
        )

        access_token = create_access_token(subject=str(pet_owner.id), token_type="pet_owner")
        return TokenResponse(access_token=access_token)

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

        pet = self.repo.get_pet(pet_id, client.id)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

        self.repo.delete_pet(pet)
