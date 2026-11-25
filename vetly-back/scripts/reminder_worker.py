"""Dedicated reminder worker. Run a single container; row locks also prevent duplicates."""
import logging
import signal
from datetime import datetime
from threading import Event

from app.db.session import SessionLocal
from app.services.appointment_reminders import send_appointment_reminders
from app.services.reminder import ReminderService
from app.services.push import create_medication_notifications, process_push
from app.services.purge import purge_deleted_pets


def run_daily_purge(db, last_run_day, now=None):
    """Purge expired soft-deleted pets once per UTC day; return the day it last ran."""
    today = (now or datetime.utcnow()).date()
    if last_run_day == today:
        return last_run_day
    try:
        purge_deleted_pets(db, now=now)
    except Exception:
        # A failed purge must not stop reminders; it is retried on the next loop.
        db.rollback()
        logging.exception("Purge of deleted pets failed")
        return last_run_day
    return today


def main():
    logging.basicConfig(level=logging.INFO)
    stop = Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())
    last_purge_day = None
    while not stop.is_set():
        with SessionLocal() as db:
            # Fail visibly so the container restart policy and monitoring can act.
            count = ReminderService(db).process_due_reminders()
            logging.info("Created %d in-app reminders", count)
            reminded = send_appointment_reminders(db)
            if reminded:
                logging.info("Sent %d appointment reminders", reminded)
            create_medication_notifications(db)
            process_push(db)
            last_purge_day = run_daily_purge(db, last_purge_day)
        stop.wait(60)


if __name__ == "__main__":
    main()
