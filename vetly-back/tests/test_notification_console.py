import io
import sys

from app.core import email_templates


def test_disabled_email_handles_greek_subject_on_windows_console(monkeypatch):
    output = io.BytesIO()
    console = io.TextIOWrapper(output, encoding='cp1252')
    monkeypatch.setattr(sys, 'stdout', console)
    monkeypatch.setattr(email_templates.settings, 'EMAIL_NOTIFICATIONS_ENABLED', False)
    def unexpected_email(*args):
        raise AssertionError('Disabled notifications must not send email')
    monkeypatch.setattr(email_templates, 'send_email', unexpected_email)
    email_templates.send_notification_email('test@example.com', 'Επιβεβαίωση ραντεβού για Λέων', '<p>Δοκιμή</p>')
    console.flush()
    assert b'notifications are disabled' in output.getvalue()
