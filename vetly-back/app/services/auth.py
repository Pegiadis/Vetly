"""
Authentication service - business logic for auth operations
"""

from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Vet, PetOwner
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    decode_email_verification_token,
    create_password_reset_token,
    decode_password_reset_token,
    decode_vet_activation_token,
    verify_password,
    get_password_hash,
)
from app.core import email as email_module
from app.core.config import settings
from app.core.email import send_verification_email, send_password_reset_email
from app.schemas.auth import (
    LoginRequest, TokenResponse, PetOwnerRegisterRequest, VetActivateRequest, VetActivationInfo,
    RegisterResponse, VerifyEmailRequest, VerifyEmailResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.vet import VetResponse
from app.schemas.owner import PetOwnerResponse
from app.core.pilot import require_pilot_access
from app.core.deps import ACCOUNT_SUSPENDED, VET_SUSPENDED
from app.core.legal import consent_fields


REGISTER_MESSAGE = "Ελέγξτε το email σας για επιβεβαίωση."


def _send_already_registered_email(to_email: str, user_type: str) -> None:
    """Tell the owner of an existing account that someone tried to register its address."""
    from app.core.email_layout import button, email_shell, muted, paragraph

    app_name = "Vetly" if user_type == "pet_owner" else "Vetly Pro"
    login_url = f"{settings.FRONTEND_URL.rstrip('/')}/{'owner' if user_type == 'pet_owner' else 'vet'}/login"
    body = (
        paragraph(
            "Κάποιος προσπάθησε να δημιουργήσει νέο λογαριασμό με αυτό το email, αλλά υπάρχει ήδη λογαριασμός. "
            "Συνδεθείτε με τον κωδικό σας ή χρησιμοποιήστε την επιλογή «Ξεχάσατε τον κωδικό;» αν δεν τον θυμάστε."
        )
        + button(login_url, "Σύνδεση")
        + muted("Αν δεν ήσασταν εσείς, αγνοήστε αυτό το email. Ο λογαριασμός σας δεν έχει αλλάξει.")
    )
    html = email_shell("Έχετε ήδη λογαριασμό", body, app_name)
    email_module.send_email(to_email, f"Έχετε ήδη λογαριασμό - {app_name}", html)


class AuthService:
    """Service for authentication operations"""

    def __init__(self, db: Session):
        self.db = db

    def login_vet(self, credentials: LoginRequest) -> TokenResponse:
        query = select(Vet).where(Vet.email == credentials.email)
        vet = self.db.scalar(query)

        if not vet:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not vet.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(credentials.password, vet.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not vet.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified",
            )

        require_pilot_access(vet.email)
        if not vet.is_verified:
            raise HTTPException(403, VET_SUSPENDED)
        access_token = create_access_token(subject=str(vet.id), token_type="vet", version=vet.auth_version)
        return TokenResponse(access_token=access_token)

    def _vet_from_activation(self, token: str, *, lock: bool = False) -> Vet:
        token_data = decode_vet_activation_token(token)
        invalid = HTTPException(400, "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζητήστε νέο από την ομάδα του Vetly.")
        if token_data is None:
            raise invalid
        query = select(Vet).where(Vet.id == token_data.sub)
        vet = self.db.scalar(query.with_for_update() if lock else query)
        # The link is single-use: setting the password (or a new invite) changes the version.
        if vet is None or vet.deactivated_at is not None or token_data.version != vet.auth_version:
            raise invalid
        return vet

    def vet_activation_info(self, token: str) -> VetActivationInfo:
        vet = self._vet_from_activation(token)
        return VetActivationInfo(name=vet.name, email=vet.email)

    def activate_vet(self, data: VetActivateRequest) -> VerifyEmailResponse:
        consent = consent_fields(data.accept_terms)
        vet = self._vet_from_activation(data.token, lock=True)
        if vet.password_hash:
            # Already activated: a password is changed from the settings or the reset link, not from an invite.
            raise HTTPException(400, "Ο λογαριασμός είναι ήδη ενεργός. Συνδεθείτε με τον κωδικό σας.")
        vet.password_hash = get_password_hash(data.password)
        vet.email_verified = True  # the link reached this inbox
        vet.is_verified = True  # from now on the clinic is shown to owners and can be booked
        vet.auth_version += 1
        vet.terms_accepted_at = consent["terms_accepted_at"]
        vet.terms_version = consent["terms_version"]
        self.db.commit()
        access_token = create_access_token(subject=str(vet.id), token_type="vet", version=vet.auth_version)
        return VerifyEmailResponse(access_token=access_token, message="Ο κωδικός ορίστηκε. Καλώς ήρθατε στο Vetly Pro.")

    def get_vet_by_id(self, vet_id: UUID) -> Vet | None:
        query = select(Vet).where(Vet.id == vet_id)
        return self.db.scalar(query)

    def login_pet_owner(self, credentials: LoginRequest) -> TokenResponse:
        query = select(PetOwner).where(func.lower(PetOwner.email) == credentials.email.casefold())
        pet_owner = self.db.scalar(query)

        if not pet_owner:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not pet_owner.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not set up for password login",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(credentials.password, pet_owner.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not pet_owner.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified",
            )

        if pet_owner.suspended_at is not None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, ACCOUNT_SUSPENDED)
        require_pilot_access(pet_owner.email)
        access_token = create_access_token(subject=str(pet_owner.id), token_type="pet_owner", version=pet_owner.auth_version)
        return TokenResponse(access_token=access_token)

    def register_pet_owner(self, data: PetOwnerRegisterRequest) -> RegisterResponse:
        require_pilot_access(data.email)
        consent = consent_fields(data.accept_terms)
        response = RegisterResponse(message=REGISTER_MESSAGE, email=data.email)
        existing = self.db.scalar(
            select(PetOwner).where(func.lower(PetOwner.email) == data.email.casefold()).with_for_update()
        )

        if existing and (existing.email_verified or not existing.password_hash):
            # Same answer as a new registration; the account is left untouched.
            # A row with an email but no password is not claimed through this form.
            if existing.email_verified:
                _send_already_registered_email(data.email, "pet_owner")
            return response

        if existing:
            # Unverified self-registration (or a pending invite registration): the new
            # submission replaces it so a squatter cannot hold someone else's address.
            # A clinic invitation pointing at this row still claims once it is verified.
            existing.password_hash = get_password_hash(data.password)
            existing.auth_version += 1
            existing.name = data.name
            existing.phone = data.phone
            existing.address = data.address
            existing.terms_accepted_at = consent.get("terms_accepted_at")
            existing.terms_version = consent.get("terms_version")
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
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            return response
        self.db.refresh(pet_owner)

        token = create_email_verification_token(str(pet_owner.id), "pet_owner")
        send_verification_email(data.email, token, "pet_owner", data.client)
        return response

    def verify_email(self, data: VerifyEmailRequest) -> VerifyEmailResponse:
        token_data = decode_email_verification_token(data.token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

        user_id = token_data.sub
        user_type = token_data.type

        if data.user_type is not None and data.user_type != user_type:
            raise HTTPException(400, 'Ο σύνδεσμος δεν αφορά λογαριασμό κηδεμόνα.')

        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.id == user_id))
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.id == user_id).with_for_update())

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.email_verified:
            # The link is single-use: once verified it can no longer sign anyone in.
            raise HTTPException(400, 'Το email έχει ήδη επιβεβαιωθεί. Συνδεθείτε με τον κωδικό σας.')
        user.email_verified = True
        if user_type == 'pet_owner':
            from app.services.client_claim import claim_verified_invitations
            claim_verified_invitations(self.db, user)
        self.db.commit()

        access_token = create_access_token(subject=str(user.id), token_type=user_type, version=user.auth_version)
        return VerifyEmailResponse(
            access_token=access_token,
            message="Email verified successfully",
            pending_professional_verification=user_type == "vet" and not user.is_verified,
        )

    def resend_verification(self, email: str, user_type: str, client: str = 'web') -> dict:
        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.email == email))
        else:
            user = self.db.scalar(select(PetOwner).where(func.lower(PetOwner.email) == email.casefold()))

        # Generic response to avoid revealing whether the email exists
        if user and not user.email_verified:
            token = create_email_verification_token(str(user.id), user_type)
            send_verification_email(email, token, user_type, client)

        return {"message": "Αν το email υπάρχει στο σύστημα, θα λάβετε ένα νέο email επιβεβαίωσης."}

    def request_password_reset(self, data: ForgotPasswordRequest) -> dict:
        if data.user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.email == data.email))
        else:
            user = self.db.scalar(select(PetOwner).where(func.lower(PetOwner.email) == data.email.casefold()))

        if user and user.email_verified:
            token = create_password_reset_token(str(user.id), data.user_type, version=user.auth_version)
            send_password_reset_email(data.email, token, data.user_type, data.client)

        return {"message": "Αν το email υπάρχει στο σύστημα, θα λάβετε email για επαναφορά κωδικού."}

    def reset_password(self, data: ResetPasswordRequest) -> VerifyEmailResponse:
        token_data = decode_password_reset_token(data.token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μη έγκυρος ή ληγμένος σύνδεσμος επαναφοράς.",
            )

        user_id = token_data.sub
        user_type = token_data.type

        if data.user_type is not None and data.user_type != user_type:
            raise HTTPException(400, 'Ο σύνδεσμος δεν αφορά λογαριασμό κηδεμόνα.')

        if user_type == "vet":
            user = self.db.scalar(select(Vet).where(Vet.id == user_id).with_for_update())
        else:
            user = self.db.scalar(select(PetOwner).where(PetOwner.id == user_id).with_for_update())

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ο χρήστης δεν βρέθηκε.",
            )

        # Reset links are single-use: the token carries the account's session version.
        if token_data.version != user.auth_version:
            raise HTTPException(400, 'Ο σύνδεσμος έχει ήδη χρησιμοποιηθεί ή ακυρωθεί. Ζητήστε νέο email.')
        user.auth_version += 1
        user.password_hash = get_password_hash(data.new_password)
        self.db.commit()

        access_token = create_access_token(subject=str(user.id), token_type=user_type, version=user.auth_version)
        return VerifyEmailResponse(
            access_token=access_token,
            message="Ο κωδικός ενημερώθηκε επιτυχώς.",
        )
