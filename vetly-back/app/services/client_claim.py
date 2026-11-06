"""Transfer clinical identities only after a verified invitation acceptance.

No new pets are created here, so clinical IDs and their history remain stable.
The caller owns the transaction. Clinic-only notes never move into owner fields.
"""
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from app.models.pet_owner import PetOwner
from app.models.pet import Pet
from app.models.appointment import Appointment
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.models.vet_client import VetClient


def claim_client(db: Session, client: VetClient, owner: PetOwner) -> None:
    if not owner.email_verified or not owner.email or owner.email.casefold() != (client.email or '').casefold():
        raise HTTPException(403, 'Επιβεβαιώστε το email στο οποίο στάλθηκε η πρόσκληση.')
    if client.status == 'linked':
        raise HTTPException(409, 'Η καρτέλα έχει ήδη συνδεθεί.')
    if not client.invite_expires_at or client.invite_expires_at < datetime.utcnow():
        raise HTTPException(410, 'Η πρόσκληση έχει λήξει. Ζητήστε νέα πρόσκληση από τον κτηνίατρο.')
    # The caller locks the clinic card; updating Pet locks the clinical identities.
    # Do not lock the source owner ahead of Pet: booking inserts need its FK lock.
    source = db.scalar(select(PetOwner).where(PetOwner.id == client.pet_owner_id))
    if source is None or (source.email is not None and source.id != owner.id):
        raise HTTPException(409, 'Η καρτέλα δεν μπορεί να συνδεθεί με αυτόν τον λογαριασμό.')
    if source.id != owner.id:
        for model in (Pet, Appointment, Reminder, Notification):
            db.execute(update(model).where(model.pet_owner_id == source.id).values(pet_owner_id=owner.id))
    client.pet_owner_id = owner.id
    client.pending_owner_id = None
    client.status = 'linked'
    client.invite_token = None
    client.invite_expires_at = None
    db.flush()


def claim_verified_invitations(db: Session, owner: PetOwner) -> None:
    clients = db.scalars(select(VetClient).where(VetClient.pending_owner_id == owner.id).order_by(VetClient.id).with_for_update()).all()
    for client in clients:
        # Account verification must still succeed if the clinic changed/revoked the invite.
        if client.invite_expires_at and client.invite_expires_at >= datetime.utcnow() and (client.email or '').casefold() == owner.email.casefold():
            claim_client(db, client, owner)
