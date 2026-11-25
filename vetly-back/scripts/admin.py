"""Manage admin panel accounts. Run from vetly-back: python -m scripts.admin --help

  python -m scripts.admin add you@example.com --name "Όνομα"   # asks for the password twice
  python -m scripts.admin add you@example.com --name "Όνομα" --generate   # prints a random password once
  python -m scripts.admin reset-password you@example.com        # also signs the admin out everywhere
  python -m scripts.admin list
  python -m scripts.admin remove you@example.com

In production: docker compose exec -it backend python -m scripts.admin ...
"""
import argparse
import getpass
import secrets
import sys

from sqlalchemy import func, select

from app.core.security import get_password_hash
from app.db.base import Admin
from app.db.session import SessionLocal

MIN_LENGTH = 12


def _password(generate: bool) -> str:
    if generate:
        password = secrets.token_urlsafe(18)
        print(f"Password (shown once, store it in a password manager): {password}")
        return password
    first = getpass.getpass(f"Password (at least {MIN_LENGTH} characters): ")
    if len(first) < MIN_LENGTH:
        sys.exit(f"Password must be at least {MIN_LENGTH} characters.")
    if getpass.getpass("Repeat password: ") != first:
        sys.exit("Passwords do not match.")
    return first


def _find(db, email: str) -> Admin | None:
    return db.scalar(select(Admin).where(func.lower(Admin.email) == email.strip().casefold()))


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage admin panel accounts.")
    commands = parser.add_subparsers(dest="command", required=True)
    add = commands.add_parser("add", help="Create an admin account")
    add.add_argument("email")
    add.add_argument("--name", required=True)
    add.add_argument("--generate", action="store_true", help="Generate and print a random password")
    reset = commands.add_parser("reset-password", help="Set a new password and end every session")
    reset.add_argument("email")
    reset.add_argument("--generate", action="store_true")
    commands.add_parser("list", help="List admin accounts")
    remove = commands.add_parser("remove", help="Delete an admin account")
    remove.add_argument("email")
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.command == "list":
            for admin in db.scalars(select(Admin).order_by(Admin.created_at)):
                last = admin.last_login_at.strftime("%Y-%m-%d %H:%M UTC") if admin.last_login_at else "never"
                print(f"{admin.email}\t{admin.name}\tlast sign-in: {last}")
            return

        admin = _find(db, args.email)
        if args.command == "add":
            if admin is not None:
                sys.exit("An admin with this email already exists. Use reset-password.")
            db.add(Admin(email=args.email.strip().lower(), name=args.name.strip(),
                         password_hash=get_password_hash(_password(args.generate))))
            db.commit()
            print(f"Admin {args.email} created. Sign in at /admin/login")
        elif admin is None:
            sys.exit("No admin with this email.")
        elif args.command == "reset-password":
            admin.password_hash = get_password_hash(_password(args.generate))
            admin.auth_version += 1
            db.commit()
            print(f"Password changed for {admin.email}; existing sessions are signed out.")
        elif args.command == "remove":
            db.delete(admin)
            db.commit()
            print(f"Admin {args.email} removed.")


if __name__ == "__main__":
    main()
