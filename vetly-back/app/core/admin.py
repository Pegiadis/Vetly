"""Platform administrators: separate accounts that sign in to the admin panel."""
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import decode_token
from app.db.base import Admin

admin_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/login")


def get_current_admin(token: str = Depends(admin_oauth2_scheme), db: Session = Depends(get_db)) -> Admin:
    """Only an admin token is accepted; vet and owner tokens are rejected as invalid credentials."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if token_data is None or token_data.type != "admin":
        raise credentials_exception
    try:
        admin_id = UUID(token_data.sub)
    except ValueError:
        raise credentials_exception
    admin = db.get(Admin, admin_id)
    if admin is None or token_data.version != admin.auth_version:
        raise credentials_exception
    return admin
