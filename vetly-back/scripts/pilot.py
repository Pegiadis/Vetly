"""Run from vetly-back: python -m scripts.pilot --help. Never prints secrets."""
import argparse
from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.reminder import ReminderService


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("check", help="Read-only deployment prerequisites; sends no emails")
    commands.add_parser("reminders", help="Create due in-app reminders (schedule every 5 minutes)")
    args = parser.parse_args()
    with SessionLocal() as db:
        if args.command == "check":
            db.execute(text("SELECT 1"))
            checks = {
                "production environment": settings.ENVIRONMENT == "production",
                "closed pilot enabled": settings.PILOT_MODE,
                "invited emails configured": bool(settings.PILOT_ALLOWED_EMAILS),
                "HTTPS frontend": settings.FRONTEND_URL.startswith("https://"),
                "HTTPS CORS allowlist": bool(settings.ALLOWED_ORIGINS) and all(x.startswith("https://") for x in settings.ALLOWED_ORIGINS),
                "signing secret at least 32 characters": len(settings.SECRET_KEY) >= 32,
                "email provider configured": settings.effective_email_provider != "console",
                "notification emails enabled": settings.EMAIL_NOTIFICATIONS_ENABLED,
            }
            for name, ok in checks.items():
                print(f"{'PASS' if ok else 'BLOCKED'}: {name}")
            print("Manual gates: email delivery, verified vet roster, backup restore, HTTPS browser smoke test.")
            raise SystemExit(0 if all(checks.values()) else 1)
        if args.command == "reminders":
            print(f"Created {ReminderService(db).process_due_reminders()} in-app reminder(s).")


if __name__ == "__main__":
    main()
