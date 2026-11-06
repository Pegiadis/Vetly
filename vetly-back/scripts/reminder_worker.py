"""Dedicated reminder worker. Run a single container; row locks also prevent duplicates."""
import logging
import signal
from threading import Event

from app.db.session import SessionLocal
from app.services.reminder import ReminderService
from app.services.push import create_medication_notifications, process_push


def main():
    logging.basicConfig(level=logging.INFO)
    stop = Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())
    while not stop.is_set():
        with SessionLocal() as db:
            # Fail visibly so the container restart policy and monitoring can act.
            count = ReminderService(db).process_due_reminders()
            logging.info("Created %d in-app reminders", count)
            create_medication_notifications(db)
            process_push(db)
        stop.wait(60)


if __name__ == "__main__":
    main()
