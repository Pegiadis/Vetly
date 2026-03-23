"""
Email sending utilities using Resend
"""

import requests

from app.core.config import settings


def send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.RESEND_API_KEY:
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}\n")
        return

    try:
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
            print(f"[EMAIL ERROR] Resend API returned {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")


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


def send_password_reset_email(to_email: str, token: str, user_type: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
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
