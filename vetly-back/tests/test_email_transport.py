"""Email transports and production settings validation. No network: smtplib is faked."""

import logging
import ssl
from email import message_from_bytes, policy

import pytest
from pydantic import ValidationError

from app.core import email as email_mod
from app.core.config import SECRET_KEY_PLACEHOLDER, Settings, settings

# conftest replaces app.core.email.send_email for every test; keep the real one.
real_send_email = email_mod.send_email

GOOD_KEY = "k" * 40


class FakeSMTP:
    """Records the calls a real smtplib client would make."""

    instances: list = []
    fail_with: Exception | None = None

    def __init__(self, host, port, timeout=None, context=None):
        self.host, self.port, self.timeout, self.context = host, port, timeout, context
        self.calls: list = []
        self.sent = None
        FakeSMTP.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def ehlo(self):
        self.calls.append("ehlo")

    def starttls(self, context=None):
        self.calls.append("starttls")
        self.tls_context = context

    def login(self, user, password):
        self.calls.append(("login", user, password))

    def send_message(self, msg):
        if FakeSMTP.fail_with:
            raise FakeSMTP.fail_with
        self.calls.append("send_message")
        self.sent = msg


class FakeSMTPSSL(FakeSMTP):
    pass


@pytest.fixture()
def smtp(monkeypatch):
    FakeSMTP.instances = []
    FakeSMTP.fail_with = None
    monkeypatch.setattr(email_mod.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(email_mod.smtplib, "SMTP_SSL", FakeSMTPSSL)
    for name, value in {
        "EMAIL_PROVIDER": "smtp",
        "SMTP_HOST": "mail.example.test",
        "SMTP_PORT": 587,
        "SMTP_USERNAME": "mailer",
        "SMTP_PASSWORD": "s3cret-password",
        "SMTP_SECURITY": "starttls",
        "SMTP_TIMEOUT_SECONDS": 7.0,
        "EMAIL_FROM": "Vetly <noreply@vetly.gr>",
    }.items():
        monkeypatch.setattr(settings, name, value)
    return FakeSMTP


HTML = (
    "<html><head><style>p{}</style></head><body><h2>Επαναφορά</h2>"
    '<p>Πατήστε <a href="https://vetly.gr/x?token=abc">εδώ</a></p></body></html>'
)


def test_starttls_flow_with_verified_context_and_timeout(smtp):
    real_send_email("owner@clinic.example", "Επαναφορά Κωδικού - Vetly", HTML)

    (client,) = smtp.instances
    assert not isinstance(client, FakeSMTPSSL)
    assert (client.host, client.port, client.timeout) == ("mail.example.test", 587, 7.0)
    assert client.calls == ["ehlo", "starttls", "ehlo", ("login", "mailer", "s3cret-password"), "send_message"]
    assert client.tls_context.verify_mode == ssl.CERT_REQUIRED
    assert client.tls_context.check_hostname is True


def test_ssl_security_uses_smtp_ssl_without_starttls(smtp, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_SECURITY", "ssl")
    monkeypatch.setattr(settings, "SMTP_PORT", 465)
    real_send_email("a@b.example", "Hi", HTML)

    (client,) = smtp.instances
    assert isinstance(client, FakeSMTPSSL)
    assert "starttls" not in client.calls
    assert client.context.verify_mode == ssl.CERT_REQUIRED
    assert client.sent is not None


def test_none_security_without_credentials_skips_tls_and_login(smtp, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_SECURITY", "none")
    monkeypatch.setattr(settings, "SMTP_USERNAME", "")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "")
    real_send_email("a@b.example", "Hi", HTML)

    assert smtp.instances[0].calls == ["ehlo", "send_message"]


def test_message_is_multipart_utf8_with_required_headers(smtp):
    real_send_email("owner@clinic.example", "Επιβεβαίωση Email - Vetly", HTML)

    raw = smtp.instances[0].sent.as_bytes()
    parsed = message_from_bytes(raw, policy=policy.default)
    assert parsed["Subject"] == "Επιβεβαίωση Email - Vetly"
    assert parsed["From"] == "Vetly <noreply@vetly.gr>"
    assert parsed["To"] == "owner@clinic.example"
    assert parsed["Date"] and parsed["Message-ID"].endswith("@vetly.gr>")
    assert parsed.get_content_type() == "multipart/alternative"
    text = parsed.get_body(("plain",)).get_content()
    html = parsed.get_body(("html",)).get_content()
    assert "Πατήστε εδώ (https://vetly.gr/x?token=abc)" in text
    assert "p{}" not in text
    assert "<h2>" in html


def test_header_injection_is_rejected_and_logged(smtp, caplog):
    with caplog.at_level(logging.ERROR, logger="app.core.email"):
        real_send_email("a@b.example", "Hi\r\nBcc: evil@x.example", HTML)

    assert smtp.instances == [] or smtp.instances[0].sent is None
    assert "Email delivery failed" in caplog.text


def test_failure_is_logged_without_secrets_address_or_body(smtp, caplog):
    FakeSMTP.fail_with = ConnectionRefusedError("refused for owner@clinic.example")
    with caplog.at_level(logging.INFO, logger="app.core.email"):
        real_send_email("owner@clinic.example", "Επαναφορά", HTML)  # must not raise

    assert "provider=smtp" in caplog.text
    assert "recipient_domain=clinic.example" in caplog.text
    assert "ConnectionRefusedError" in caplog.text
    for secret in ("s3cret-password", "owner@clinic.example", "token=abc", "Email sent"):
        assert secret not in caplog.text


def test_success_logs_domain_only(smtp, caplog):
    with caplog.at_level(logging.INFO, logger="app.core.email"):
        real_send_email("owner@clinic.example", "Hi", HTML)

    assert "Email sent: provider=smtp recipient_domain=clinic.example" in caplog.text
    assert "owner@" not in caplog.text


def test_console_provider_never_touches_network(monkeypatch, capsys):
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "console")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "key-present")

    def boom(*a, **k):
        raise AssertionError("network used")

    monkeypatch.setattr(email_mod.requests, "post", boom)
    monkeypatch.setattr(email_mod.smtplib, "SMTP", boom)
    real_send_email("a@b.example", "Subject", HTML)

    assert "EMAIL TO: a@b.example" in capsys.readouterr().out


def test_resend_failure_status_is_logged(monkeypatch, caplog):
    class Resp:
        status_code = 422
        text = "body with owner@clinic.example"

    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "resend")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "key-present")
    monkeypatch.setattr(email_mod.requests, "post", lambda *a, **k: Resp())
    with caplog.at_level(logging.ERROR, logger="app.core.email"):
        real_send_email("owner@clinic.example", "Hi", HTML)

    assert "provider=resend" in caplog.text
    assert "owner@clinic.example" not in caplog.text


def test_unset_provider_with_resend_key_keeps_resend(monkeypatch):
    calls = []

    class Resp:
        status_code = 200

    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "")
    monkeypatch.setattr(settings, "RESEND_API_KEY", "key-present")
    monkeypatch.setattr(email_mod.requests, "post", lambda *a, **k: calls.append(a) or Resp())

    assert settings.effective_email_provider == "resend"
    real_send_email("a@b.example", "Hi", HTML)
    assert len(calls) == 1


def test_unset_provider_without_key_is_console():
    s = Settings(_env_file=None, DATABASE_URL="postgresql://x", SECRET_KEY=GOOD_KEY, EMAIL_PROVIDER="", RESEND_API_KEY="")
    assert s.effective_email_provider == "console"


# --- startup validation ---------------------------------------------------


def make(**overrides):
    values = dict(
        _env_file=None,
        DATABASE_URL="postgresql://x",
        SECRET_KEY=GOOD_KEY,
        ENVIRONMENT="production",
        EMAIL_PROVIDER="console",
        RESEND_API_KEY="",
    )
    values.update(overrides)
    return Settings(**values)


def test_production_smtp_requires_host():
    with pytest.raises(ValidationError, match="SMTP_HOST"):
        make(EMAIL_PROVIDER="smtp", SMTP_HOST="")
    assert make(EMAIL_PROVIDER="smtp", SMTP_HOST="mail.example.test").SMTP_PORT == 587


def test_production_smtp_credentials_must_be_paired_and_encrypted():
    with pytest.raises(ValidationError, match="together"):
        make(EMAIL_PROVIDER="smtp", SMTP_HOST="h", SMTP_USERNAME="u")
    with pytest.raises(ValidationError, match="unencrypted"):
        make(EMAIL_PROVIDER="smtp", SMTP_HOST="h", SMTP_USERNAME="u", SMTP_PASSWORD="p", SMTP_SECURITY="none")


def test_production_explicit_resend_requires_key():
    with pytest.raises(ValidationError, match="RESEND_API_KEY"):
        make(EMAIL_PROVIDER="resend")


def test_provider_choice_is_case_insensitive_and_validated():
    assert make(EMAIL_PROVIDER=" SMTP ", SMTP_HOST="h").EMAIL_PROVIDER == "smtp"
    with pytest.raises(ValidationError):
        make(EMAIL_PROVIDER="carrier-pigeon")


@pytest.mark.parametrize("key", ["short", "x" * 31, SECRET_KEY_PLACEHOLDER])
def test_production_rejects_weak_secret_key(key):
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        make(SECRET_KEY=key)


def test_development_accepts_short_secret_key_with_warning(caplog):
    with caplog.at_level(logging.WARNING, logger="app.core.config"):
        s = make(ENVIRONMENT="development", SECRET_KEY="short")

    assert s.SECRET_KEY == "short"
    assert "SECRET_KEY" in caplog.text
