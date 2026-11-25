"""
Email notification templates for Vetly.
All user-facing text is in Greek.
"""

from functools import wraps
from html import escape

from app.core.config import settings
from app.core.email import send_email
from app.core.email_layout import button, details_box, detail, email_shell, paragraph, quote


# ── Layout helpers ───────────────────────────────────────────────

def _owner_email(title: str, body_html: str) -> str:
    return email_shell(title, body_html, "Vetly")


def _vet_email(title: str, body_html: str) -> str:
    return email_shell(title, body_html, "Vetly Pro")


_p = paragraph
_detail = detail
_details_box = details_box


def _escaped(template):
    """Escape every text argument: names, comments and notes are typed by users."""
    @wraps(template)
    def wrapper(*args, **kwargs):
        clean = [escape(a) if isinstance(a, str) else a for a in args]
        clean_kw = {k: escape(v) if isinstance(v, str) else v for k, v in kwargs.items()}
        return template(*clean, **clean_kw)
    return wrapper


# ── Public helper ────────────────────────────────────────────────

def send_notification_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an email notification if EMAIL_NOTIFICATIONS_ENABLED is True.

    When disabled, logs to console instead (same pattern as send_email fallback).
    """
    if not settings.EMAIL_NOTIFICATIONS_ENABLED:
        # Redirected Windows stdout can use cp1252. A Greek subject must not
        # turn a successfully saved appointment into an HTTP 500 response.
        print("[NOTIFICATION EMAIL SKIPPED] Email notifications are disabled.")
        return

    send_email(to_email, subject, html_body)


# ── Template: Appointment confirmed (→ owner) ───────────────────

@_escaped
def appointment_confirmed_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str, service: str = "",
) -> tuple[str, str]:
    """Return (subject, html) for appointment-confirmed email to owner."""
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
        *([_detail("Υπηρεσία", service)] if service else []),
    )
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(f"Το ραντεβού σας με τον/την <strong>{vet_name}</strong> επιβεβαιώθηκε!")
        + details
        + _p("Μπορείτε να δείτε τις λεπτομέρειες στον πίνακα ελέγχου σας στο Vetly.")
    )
    subject = f"Επιβεβαίωση ραντεβού - Vetly"
    return subject, _owner_email("Το ραντεβού σας επιβεβαιώθηκε", body)


# ── Template: Appointment rejected (→ owner) ────────────────────

@_escaped
def appointment_rejected_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
    )
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(
            f"Δυστυχώς, το ραντεβού σας με τον/την <strong>{vet_name}</strong> "
            f"δεν μπόρεσε να επιβεβαιωθεί."
        )
        + details
        + _p("Μπορείτε να κλείσετε νέο ραντεβού μέσω του Vetly.")
    )
    subject = "Ακύρωση αιτήματος ραντεβού - Vetly"
    return subject, _owner_email("Το ραντεβού δεν επιβεβαιώθηκε", body)


# ── Template: Appointment cancelled by owner (→ vet) ────────────

@_escaped
def appointment_cancelled_by_owner_email(
    vet_name: str, owner_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    details = _details_box(
        _detail("Ιδιοκτήτης", owner_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
    )
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p(
            f"Ο/Η <strong>{owner_name}</strong> ακύρωσε το ραντεβού "
            f"για το κατοικίδιο <strong>{pet_name}</strong>."
        )
        + details
    )
    subject = "Ακύρωση ραντεβού - Vetly Pro"
    return subject, _vet_email("Ακύρωση ραντεβού", body)


# ── Template: Appointment cancelled by vet (→ owner) ────────────

@_escaped
def appointment_cancelled_by_vet_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
    )
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(
            f"Ο/Η κτηνίατρος <strong>{vet_name}</strong> ακύρωσε το ραντεβού σας "
            f"για το κατοικίδιο <strong>{pet_name}</strong>."
        )
        + details
        + _p("Μπορείτε να κλείσετε νέο ραντεβού μέσω του Vetly.")
    )
    subject = "Ακύρωση ραντεβού - Vetly"
    return subject, _owner_email("Ακύρωση ραντεβού", body)


# ── Template: Appointment rescheduled by owner (→ vet) ──────────

@_escaped
def appointment_rescheduled_by_owner_email(
    vet_name: str, owner_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    details = _details_box(
        _detail("Ιδιοκτήτης", owner_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Νέα ημερομηνία", date_str),
    )
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p(
            f"Ο/Η <strong>{owner_name}</strong> αναπρογραμμάτισε το ραντεβού "
            f"για το κατοικίδιο <strong>{pet_name}</strong>."
        )
        + details
        + _p("Ελέγξτε τον πίνακα ελέγχου σας στο Vetly Pro για λεπτομέρειες.")
    )
    subject = "Αναπρογραμματισμός ραντεβού - Vetly Pro"
    return subject, _vet_email("Νέα ώρα ραντεβού", body)


# ── Template: Appointment rescheduled by vet (→ owner) ──────────

@_escaped
def appointment_rescheduled_by_vet_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Νέα ημερομηνία", date_str),
    )
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(
            f"Ο/Η κτηνίατρος <strong>{vet_name}</strong> αναπρογραμμάτισε το ραντεβού σας "
            f"για το κατοικίδιο <strong>{pet_name}</strong>."
        )
        + details
        + _p("Ελέγξτε τον πίνακα ελέγχου σας στο Vetly για λεπτομέρειες.")
    )
    subject = "Αναπρογραμματισμός ραντεβού - Vetly"
    return subject, _owner_email("Νέα ώρα ραντεβού", body)


# ── Template: Appointment reminder (→ owner, 24h before) ────────

@_escaped
def appointment_reminder_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str, service: str = "",
) -> tuple[str, str]:
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
        *([_detail("Υπηρεσία", service)] if service else []),
    )
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(f"Σας υπενθυμίζουμε το ραντεβού σας στις <strong>{date_str}</strong>.")
        + details
        + _p("Αν χρειάζεται να ακυρώσετε ή να αλλάξετε ώρα, μπορείτε να το κάνετε μέσω του Vetly.")
    )
    subject = "Υπενθύμιση ραντεβού - Vetly"
    return subject, _owner_email("Υπενθύμιση ραντεβού", body)


# ── Template: New appointment request (→ vet) ───────────────────

@_escaped
def new_appointment_request_email(
    vet_name: str, owner_name: str, pet_name: str, date_str: str, service: str = "",
) -> tuple[str, str]:
    details = _details_box(
        _detail("Ιδιοκτήτης", owner_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Ημερομηνία", date_str),
        *([_detail("Υπηρεσία", service)] if service else []),
    )
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p(
            f"Ο/Η <strong>{owner_name}</strong> ζήτησε νέο ραντεβού "
            f"για το κατοικίδιο <strong>{pet_name}</strong>."
        )
        + details
        + _p("Συνδεθείτε στο Vetly Pro για να αποδεχτείτε ή να απορρίψετε το αίτημα.")
    )
    subject = "Νέο αίτημα ραντεβού - Vetly Pro"
    return subject, _vet_email("Νέο αίτημα ραντεβού", body)


# ── Template: Examination completed (→ owner) ───────────────────

@_escaped
def examination_completed_email(
    owner_name: str, vet_name: str, pet_name: str, date_str: str,
) -> tuple[str, str]:
    body = (
        _p(f"Αγαπητέ/ή {owner_name},")
        + _p(
            f"Η εξέταση του κατοικίδιου σας <strong>{pet_name}</strong> "
            f"από τον/την <strong>{vet_name}</strong> ολοκληρώθηκε."
        )
        + _details_box(
            _detail("Κτηνίατρος", vet_name),
            _detail("Κατοικίδιο", pet_name),
            _detail("Ημερομηνία", date_str),
        )
        + _p("Μπορείτε να δείτε τα αποτελέσματα και τις σημειώσεις στο ιστορικό υγείας στο Vetly.")
    )
    subject = "Ολοκλήρωση εξέτασης - Vetly"
    return subject, _owner_email("Η εξέταση ολοκληρώθηκε", body)


# ── Template: New reminder (→ owner) ────────────────────────────

@_escaped
def new_reminder_email(
    vet_name: str, pet_name: str, title: str, due_date: str, message: str = "",
) -> tuple[str, str]:
    """Return (subject, html) for new-reminder email to owner."""
    details = _details_box(
        _detail("Κτηνίατρος", vet_name),
        _detail("Κατοικίδιο", pet_name),
        _detail("Υπενθύμιση", title),
        _detail("Ημερομηνία", due_date),
    )
    msg_html = _p(f"<em>{message}</em>") if message else ""
    body = (
        _p(f"Ο/Η κτηνίατρος <strong>{vet_name}</strong> δημιούργησε μια νέα υπενθύμιση για το κατοικίδιό σας <strong>{pet_name}</strong>.")
        + details
        + msg_html
        + _p("Μπορείτε να δείτε τις υπενθυμίσεις σας στον πίνακα ελέγχου στο Vetly.")
    )
    subject = "Νέα υπενθύμιση - Vetly"
    return subject, _owner_email("Νέα υπενθύμιση", body)


# ── Template: Vet account approved (→ vet) ──────────────────────

@_escaped
def vet_account_approved_email(vet_name: str, login_url: str) -> tuple[str, str]:
    """Return (subject, html) telling a vet that the professional verification passed."""
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p("Ο λογαριασμός σας εγκρίθηκε. Μπορείτε πλέον να συνδεθείτε και να ξεκινήσετε να χρησιμοποιείτε το Vetly Pro.")
        + button(login_url, "Σύνδεση στο Vetly Pro")
    )
    subject = "Ο λογαριασμός σας εγκρίθηκε - Vetly Pro"
    return subject, _vet_email("Ο λογαριασμός σας εγκρίθηκε", body)


# ── Template: New review (→ vet) ────────────────────────────────

@_escaped
def new_review_email(
    vet_name: str, owner_name: str, rating: int, comment: str = "",
) -> tuple[str, str]:
    stars = "★" * rating + "☆" * (5 - rating)
    details = _details_box(
        _detail("Ιδιοκτήτης", owner_name),
        _detail("Βαθμολογία", stars),
    )
    comment_html = ""
    if comment:
        comment_html = quote(f'&laquo;{comment}&raquo;')
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p(f"Ο/Η <strong>{owner_name}</strong> σας άφησε μια νέα αξιολόγηση!")
        + details
        + comment_html
    )
    subject = "Νέα αξιολόγηση - Vetly Pro"
    return subject, _vet_email("Νέα αξιολόγηση", body)
