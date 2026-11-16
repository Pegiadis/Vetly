"""
Shared look for every email Vetly sends.

Mirrors the web design: clinic green on a quiet ink-tinted page, a bordered
white card, no coloured header band. Layout uses tables and inline styles only,
because mail clients ignore stylesheets, flexbox and web fonts.
"""

from html import escape

from app.core.config import settings

CLINIC_600 = "#006064"
CLINIC_100 = "#def5ed"
CLINIC_50 = "#effaf7"
INK_900 = "#1f2937"
INK_600 = "#495d58"
INK_500 = "#5c6c68"
INK_400 = "#748780"
INK_200 = "#dce5e2"
INK_50 = "#f6f8f7"

FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def paragraph(html: str) -> str:
    return f'<p style="color:{INK_600};font-size:15px;line-height:1.6;margin:0 0 16px;">{html}</p>'


def muted(html: str) -> str:
    return f'<p style="color:{INK_400};font-size:13px;line-height:1.5;margin:0 0 16px;">{html}</p>'


def button(url: str, label: str) -> str:
    """Primary action. The link is repeated as text for clients that hide buttons."""
    href = escape(url, quote=True)
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">'
        f'<tr><td style="background:{CLINIC_600};border-radius:10px;">'
        f'<a href="{href}" style="display:inline-block;padding:12px 24px;color:#ffffff;'
        f'font-size:15px;font-weight:600;text-decoration:none;">{label}</a>'
        '</td></tr></table>'
        f'<p style="color:{INK_400};font-size:12px;line-height:1.5;margin:0 0 16px;word-break:break-all;">'
        f'Αν το κουμπί δεν λειτουργεί, αντιγράψτε αυτόν τον σύνδεσμο:<br>'
        f'<a href="{href}" style="color:{CLINIC_600};">{href}</a></p>'
    )


def detail(label: str, value: str) -> str:
    return (
        '<tr>'
        f'<td style="padding:8px 16px 8px 0;border-bottom:1px solid {INK_200};color:{INK_500};'
        f'font-size:13px;white-space:nowrap;vertical-align:top;">{label}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid {INK_200};color:{INK_900};'
        f'font-size:14px;font-weight:600;text-align:right;">{value}</td>'
        '</tr>'
    )


def details_box(*rows: str) -> str:
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:8px 0 24px;border-top:1px solid {INK_200};">{"".join(rows)}</table>'
    )


def quote(html: str) -> str:
    return (
        f'<div style="background:{CLINIC_50};border-left:3px solid {CLINIC_600};'
        f'padding:12px 16px;border-radius:0 10px 10px 0;margin:0 0 24px;">'
        f'<p style="color:{INK_600};font-size:15px;line-height:1.6;font-style:italic;margin:0;">{html}</p>'
        '</div>'
    )


def email_shell(title: str, body_html: str, app_name: str = "Vetly") -> str:
    """Wrap body content in the standard Vetly email."""
    site = settings.FRONTEND_URL.rstrip("/")
    site_label = site.split("://", 1)[-1]
    pro = (
        f'<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;'
        f'background:{CLINIC_100};color:{CLINIC_600};font-size:11px;font-weight:600;'
        f'vertical-align:middle;">Για κτηνιάτρους</span>'
        if app_name != "Vetly"
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="el">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:{INK_50};font-family:{FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{INK_50};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr><td style="background:#ffffff;border:1px solid {INK_200};border-radius:12px;padding:20px 28px 16px;font-family:{FONT};">
          <!-- The logo file carries its own white plate: dark mode recolours the card but not images. -->
          <div style="margin:0 0 16px -8px;">
            <a href="{escape(site, quote=True)}" style="text-decoration:none;"><img src="{escape(site, quote=True)}/branding/vetly-logo-email.png" width="136" height="56" alt="Vetly" style="display:inline-block;border:0;vertical-align:middle;color:{CLINIC_600};font-size:22px;font-weight:700;"></a>{pro}
          </div>
          <h1 style="color:{INK_900};font-size:20px;line-height:1.3;font-weight:600;margin:0 0 16px;">{title}</h1>
          {body_html}
        </td></tr>
        <tr><td style="padding:16px 4px 0;font-family:{FONT};color:{INK_400};font-size:12px;line-height:1.5;">
          Αυτό το email στάλθηκε αυτόματα από το {app_name}. Παρακαλούμε μην απαντήσετε σε αυτό το μήνυμα.<br>
          <a href="{escape(site, quote=True)}" style="color:{INK_500};">{escape(site_label)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
