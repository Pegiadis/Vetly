"""
Email sending utilities
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings


def send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_HOST:
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}")
        print(html_body)
        print(f"{'='*60}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())


def send_verification_email(to_email: str, token: str, user_type: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
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
