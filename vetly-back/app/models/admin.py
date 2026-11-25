"""
Platform administrator model
"""

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base_class import BaseModel


class Admin(BaseModel):
    """
    A Vetly staff account for the admin panel.

    Separate from vets and pet owners: it has no clinic or pets, signs in at
    /admin/login and is created only from the command line (scripts/create_admin.py).
    """

    __tablename__ = "admins"

    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Bumped to revoke every issued session token (password reset from the command line).
    auth_version = Column(Integer, default=0, server_default="0", nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Admin(id={self.id}, email={self.email})>"
