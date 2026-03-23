"""
Email notification templates for Vetly.
All user-facing text is in Greek.
"""

from app.core.config import settings
from app.core.email import send_email


# ── Color constants ──────────────────────────────────────────────

TEAL = "#0d9488"
TEAL_LIGHT = "#f0fdfa"
INDIGO = "#4f46e5"
INDIGO_LIGHT = "#eef2ff"


# ── Base wrapper ─────────────────────────────────────────────────

def _wrap_html(title: str, body_html: str, color: str, color_light: str, app_name: str) -> str:
    """Wrap body content in the standard Vetly email template."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:{color};padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">{app_name}</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;margin:0 0 16px;">{title}</h2>
      {body_html}
      <div style="margin-top:32px;padding:16px;background:{color_light};border-radius:8px;">
        <p style="color:#64748b;font-size:12px;margin:0;">
          Αυτό το email στάλθηκε αυτόματα από το {app_name}. Παρακαλούμε μην απαντήσετε σε αυτό το μήνυμα.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def _owner_email(title: str, body_html: str) -> str:
    return _wrap_html(title, body_html, TEAL, TEAL_LIGHT, "Vetly")


def _vet_email(title: str, body_html: str) -> str:
    return _wrap_html(title, body_html, INDIGO, INDIGO_LIGHT, "Vetly Pro")


def _p(text: str) -> str:
    return f'<p style="color:#475569;line-height:1.6;margin:0 0 16px;">{text}</p>'


def _detail(label: str, value: str) -> str:
    return (
        f'<div style="display:flex;justify-content:space-between;padding:8px 0;'
        f'border-bottom:1px solid #f1f5f9;">'
        f'<span style="color:#64748b;font-size:14px;">{label}</span>'
        f'<span style="color:#1e293b;font-size:14px;font-weight:600;">{value}</span>'
        f'</div>'
    )


def _details_box(*rows: str) -> str:
    inner = "".join(rows)
    return (
        f'<div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0;">'
        f'{inner}</div>'
    )


# ── Public helper ────────────────────────────────────────────────

def send_notification_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an email notification if EMAIL_NOTIFICATIONS_ENABLED is True.

    When disabled, logs to console instead (same pattern as send_email fallback).
    """
    if not settings.EMAIL_NOTIFICATIONS_ENABLED:
        print(f"[NOTIFICATION EMAIL SKIPPED] To: {to_email} | Subject: {subject}")
        return

    send_email(to_email, subject, html_body)


# ── Template: Appointment confirmed (→ owner) ───────────────────

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
    return subject, _owner_email("Ραντεβού Επιβεβαιώθηκε", body)


# ── Template: Appointment rejected (→ owner) ────────────────────

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
    return subject, _owner_email("Ραντεβού Απορρίφθηκε", body)


# ── Template: Appointment cancelled by owner (→ vet) ────────────

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
    return subject, _vet_email("Ακύρωση Ραντεβού", body)


# ── Template: Appointment cancelled by vet (→ owner) ────────────

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
    return subject, _owner_email("Ακύρωση Ραντεβού", body)


# ── Template: Appointment rescheduled by owner (→ vet) ──────────

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
    return subject, _vet_email("Αναπρογραμματισμός Ραντεβού", body)


# ── Template: Appointment rescheduled by vet (→ owner) ──────────

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
    return subject, _owner_email("Αναπρογραμματισμός Ραντεβού", body)


# ── Template: Appointment reminder (→ owner, 24h before) ────────

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
        + _p("Σας υπενθυμίζουμε ότι έχετε προγραμματισμένο ραντεβού αύριο.")
        + details
        + _p("Αν χρειάζεται να ακυρώσετε ή να αλλάξετε ώρα, μπορείτε να το κάνετε μέσω του Vetly.")
    )
    subject = "Υπενθύμιση ραντεβού - Vetly"
    return subject, _owner_email("Υπενθύμιση Ραντεβού", body)


# ── Template: New appointment request (→ vet) ───────────────────

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
    return subject, _vet_email("Νέο Αίτημα Ραντεβού", body)


# ── Template: Examination completed (→ owner) ───────────────────

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
    return subject, _owner_email("Εξέταση Ολοκληρώθηκε", body)


# ── Template: New reminder (→ owner) ────────────────────────────

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
    return subject, _owner_email("Νέα Υπενθύμιση", body)


# ── Template: New review (→ vet) ────────────────────────────────

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
        comment_html = (
            f'<div style="background:#f8fafc;border-left:3px solid {INDIGO};'
            f'padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">'
            f'<p style="color:#475569;font-style:italic;margin:0;">&laquo;{comment}&raquo;</p>'
            f'</div>'
        )
    body = (
        _p(f"Αγαπητέ/ή {vet_name},")
        + _p(f"Ο/Η <strong>{owner_name}</strong> σας άφησε μια νέα αξιολόγηση!")
        + details
        + comment_html
    )
    subject = "Νέα αξιολόγηση - Vetly Pro"
    return subject, _vet_email("Νέα Αξιολόγηση", body)
