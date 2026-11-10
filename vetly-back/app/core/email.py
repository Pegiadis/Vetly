"""
Email sending utilities.

Transport is chosen by settings.effective_email_provider: smtp (our own mail
server), resend (Resend HTTP API) or console (log only, nothing is sent).
"""

import logging
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import format_datetime, make_msgid, parseaddr
from html.parser import HTMLParser
from urllib.parse import urlencode

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

_BLOCK_TAGS = {"p", "div", "br", "h1", "h2", "h3", "h4", "li", "tr", "table"}


class _HtmlToText(HTMLParser):
    """Minimal HTML to plain text for the text/plain alternative part."""

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0
        self._href: str | None = None
        self._link_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ("style", "script", "head"):
            self._skip += 1
        elif tag == "a":
            self._href = dict(attrs).get("href")
            self._link_text = []
        elif tag in _BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("style", "script", "head"):
            self._skip = max(0, self._skip - 1)
        elif tag == "a":
            text = " ".join("".join(self._link_text).split())
            if self._href and self._href != text:
                self.parts.append(f" ({self._href})")
            self._href = None
        elif tag in _BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if self._skip:
            return
        self.parts.append(data)
        if self._href is not None:
            self._link_text.append(data)


def html_to_text(html_body: str) -> str:
    parser = _HtmlToText()
    parser.feed(html_body)
    lines = [" ".join(line.split()) for line in "".join(parser.parts).splitlines()]
    text = "\n".join(line for line in lines if line)
    return text + "\n"


def _recipient_domain(to_email: str) -> str:
    """Domain part only, so logs never carry a full address."""
    return to_email.rsplit("@", 1)[-1] if "@" in to_email else "unknown"


def build_message(to_email: str, subject: str, html_body: str) -> EmailMessage:
    """Multipart text+HTML message. The default policy encodes non-ASCII headers as UTF-8
    and rejects line breaks in header values."""
    _, from_address = parseaddr(settings.EMAIL_FROM)
    sender_domain = _recipient_domain(from_address) if from_address else "localhost"

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = format_datetime(datetime.now(timezone.utc))
    msg["Message-ID"] = make_msgid(domain=sender_domain)
    msg.set_content(html_to_text(html_body), charset="utf-8")
    msg.add_alternative(html_body, subtype="html", charset="utf-8")
    return msg


def _send_smtp(msg: EmailMessage) -> None:
    host, port, timeout = settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_TIMEOUT_SECONDS
    security = settings.SMTP_SECURITY
    context = ssl.create_default_context()  # verifies certificate chain and hostname

    if security == "ssl":
        client = smtplib.SMTP_SSL(host, port, timeout=timeout, context=context)
    else:
        client = smtplib.SMTP(host, port, timeout=timeout)

    with client:
        client.ehlo()
        if security == "starttls":
            client.starttls(context=context)
            client.ehlo()
        if settings.SMTP_USERNAME:
            client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        client.send_message(msg)


def _send_resend(to_email: str, subject: str, html_body: str) -> None:
    response = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        json={
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        },
        timeout=10,
    )
    if response.status_code not in (200, 201):
        raise RuntimeError(f"Resend API returned HTTP {response.status_code}")


def send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send one email. Failures are logged and never raised, so a mail outage cannot
    break the request that triggered the email."""
    provider = settings.effective_email_provider

    if provider == "console":
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}\n")
        return

    try:
        if provider == "smtp":
            _send_smtp(build_message(to_email, subject, html_body))
        else:
            _send_resend(to_email, subject, html_body)
    except Exception as exc:
        # Only the exception class: its text can include addresses or server replies.
        logger.error(
            "Email delivery failed: provider=%s recipient_domain=%s error=%s",
            provider,
            _recipient_domain(to_email),
            type(exc).__name__,
        )
        return

    logger.info("Email sent: provider=%s recipient_domain=%s", provider, _recipient_domain(to_email))


def auth_email_url(action: str, token: str, user_type: str, client: str) -> str:
    base = settings.FRONTEND_URL.rstrip('/')
    if client == 'mobile' and user_type == 'pet_owner':
        return f"{base}/mobile-auth?{urlencode({'action': action, 'token': token})}"
    return f"{base}/{action}?{urlencode({'token': token})}"


def send_verification_email(to_email: str, token: str, user_type: str, client: str = 'web') -> None:
    verify_url = auth_email_url('verify-email', token, user_type, client)
    color = "#0d9488" if user_type == "pet_owner" else "#4f46e5"
    color_light = "#f0fdfa" if user_type == "pet_owner" else "#eef2ff"
    app_name = "Vetly" if user_type == "pet_owner" else "Vetly Pro"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
      <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <div style="background:{color};padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">{app_name}</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1e293b;margin:0 0 16px;">Επιβεβαίωση Email</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
            Ευχαριστούμε για την εγγραφή σας! Πατήστε το παρακάτω κουμπί για να επιβεβαιώσετε το email σας.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{verify_url}" style="display:inline-block;background:{color};color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              Επιβεβαίωση Email
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:24px 0 0;">
            Αν δεν δημιουργήσατε λογαριασμό στο {app_name}, αγνοήστε αυτό το email.
          </p>
          <div style="margin-top:24px;padding:16px;background:{color_light};border-radius:8px;">
            <p style="color:#64748b;font-size:12px;margin:0;word-break:break-all;">
              Αν το κουμπί δεν λειτουργεί, αντιγράψτε αυτόν τον σύνδεσμο:<br>{verify_url}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """

    send_email(to_email, f"Επιβεβαίωση Email - {app_name}", html)


def send_password_reset_email(to_email: str, token: str, user_type: str, client: str = 'web') -> None:
    reset_url = auth_email_url('reset-password', token, user_type, client)
    color = "#0d9488" if user_type == "pet_owner" else "#4f46e5"
    color_light = "#f0fdfa" if user_type == "pet_owner" else "#eef2ff"
    app_name = "Vetly" if user_type == "pet_owner" else "Vetly Pro"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
      <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <div style="background:{color};padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">{app_name}</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1e293b;margin:0 0 16px;">Επαναφορά Κωδικού</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
            Λάβαμε αίτημα επαναφοράς κωδικού πρόσβασης. Πατήστε το παρακάτω κουμπί για να ορίσετε νέο κωδικό.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{reset_url}" style="display:inline-block;background:{color};color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              Επαναφορά Κωδικού
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:24px 0 0;">
            Αν δεν ζητήσατε επαναφορά κωδικού, αγνοήστε αυτό το email. Ο σύνδεσμος λήγει σε 1 ώρα.
          </p>
          <div style="margin-top:24px;padding:16px;background:{color_light};border-radius:8px;">
            <p style="color:#64748b;font-size:12px;margin:0;word-break:break-all;">
              Αν το κουμπί δεν λειτουργεί, αντιγράψτε αυτόν τον σύνδεσμο:<br>{reset_url}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """

    send_email(to_email, f"Επαναφορά Κωδικού - {app_name}", html)
