import io

import pytest
from PIL import Image

from app.core.uploads import MAX_IMAGE_PIXELS, detect_image_type, sanitize_image


@pytest.fixture()
def upload_dir(tmp_path, monkeypatch):
    from app.utils import upload

    monkeypatch.setattr(upload, "UPLOAD_DIR", tmp_path)
    return tmp_path


def _image(fmt="PNG", size=(4, 4), mode="RGB", **save_kwargs):
    buf = io.BytesIO()
    Image.new(mode, size, (200, 30, 30) if mode == "RGB" else (200, 30, 30, 128)).save(buf, fmt, **save_kwargs)
    return buf.getvalue()


def _post(client, headers, name, data, content_type="image/png", path="/api/v1/uploads/owner/photo"):
    return client.post(path, headers=headers, files={"file": (name, data, content_type)})


def test_valid_png_is_stored_with_server_name(client, owner_auth_header, upload_dir):
    r = _post(client, owner_auth_header, "../../evil name.png", _image())
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("/uploads/owner/") and url.endswith(".png")
    assert "evil" not in url and ".." not in url
    stored = upload_dir / url.removeprefix("/uploads/")
    assert stored.exists()
    assert stored.resolve().is_relative_to(upload_dir.resolve())


def test_type_is_decided_by_bytes_not_client_headers(client, owner_auth_header, upload_dir):
    jpeg = _image("JPEG")
    r = _post(client, owner_auth_header, "photo.png", jpeg, "image/png")
    assert r.status_code == 200, r.text
    assert r.json()["url"].endswith(".jpg")


def test_wrong_magic_bytes_with_image_extension_rejected(client, owner_auth_header, upload_dir):
    r = _post(client, owner_auth_header, "fake.png", b"<?php echo 1; ?>" * 10, "image/png")
    assert r.status_code == 400
    assert "Μη αποδεκτός" in r.json()["detail"]
    assert not any(upload_dir.rglob("*.*"))


def test_valid_signature_but_corrupt_body_rejected(client, owner_auth_header, upload_dir):
    r = _post(client, owner_auth_header, "x.png", b"\x89PNG\r\n\x1a\n" + b"garbage" * 20)
    assert r.status_code == 400
    assert not any(upload_dir.rglob("*.*"))


def test_oversized_file_rejected_with_greek_message(client, owner_auth_header, upload_dir):
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024 + 10)
    r = _post(client, owner_auth_header, "big.png", big)
    assert r.status_code == 413
    assert "πολύ μεγάλο" in r.json()["detail"]
    assert not any(upload_dir.rglob("*.*"))


def test_huge_declared_content_length_rejected_early(client, owner_auth_header):
    r = client.post(
        "/api/v1/uploads/owner/photo",
        headers={**owner_auth_header, "Content-Length": str(50 * 1024 * 1024), "Content-Type": "multipart/form-data; boundary=x"},
        content=b"",
    )
    assert r.status_code == 413


def test_pixel_bomb_rejected():
    from fastapi import HTTPException

    side = int(MAX_IMAGE_PIXELS**0.5) + 100
    bomb = _image("PNG", size=(side, side), compress_level=9)
    with pytest.raises(HTTPException) as exc:
        sanitize_image(bomb)
    assert exc.value.status_code == 400


def test_exif_is_stripped():
    img = Image.new("RGB", (8, 8), (1, 2, 3))
    exif = img.getexif()
    exif[0x010F] = "SecretCamera"
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    assert b"SecretCamera" in buf.getvalue()
    clean, ext = sanitize_image(buf.getvalue())
    assert ext == ".jpg"
    assert b"SecretCamera" not in clean


def test_webp_supported_and_detected():
    data = _image("WEBP")
    assert detect_image_type(data[:16]) == "webp"
    clean, ext = sanitize_image(data)
    assert ext == ".jpg"
    data_alpha = _image("WEBP", mode="RGBA")
    assert sanitize_image(data_alpha)[1] == ".png"


def test_gif_and_svg_rejected(client, owner_auth_header, upload_dir):
    gif = _image("GIF")
    assert _post(client, owner_auth_header, "a.gif", gif, "image/gif").status_code == 400
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    assert _post(client, owner_auth_header, "a.svg", svg, "image/svg+xml").status_code == 400


def test_pet_photo_requires_ownership(client, owner_auth_header, vet_auth_header, upload_dir):
    r = _post(client, vet_auth_header, "a.png", _image(), path="/api/v1/uploads/pet/00000000-0000-0000-0000-000000000000/photo")
    assert r.status_code in (401, 403)
    r = _post(client, owner_auth_header, "a.png", _image(), path="/api/v1/uploads/pet/00000000-0000-0000-0000-000000000000/photo")
    assert r.status_code == 404


def test_uploads_require_auth(client):
    r = client.post("/api/v1/uploads/owner/photo", files={"file": ("a.png", _image(), "image/png")})
    assert r.status_code in (401, 403)


def test_failed_replacement_keeps_existing_vet_photo(client, vet_auth_header, upload_dir):
    path = "/api/v1/uploads/vet/photo"
    first = _post(client, vet_auth_header, "a.png", _image(), path=path)
    assert first.status_code == 200, first.text
    stored = upload_dir / first.json()["url"].removeprefix("/uploads/")
    bad = _post(client, vet_auth_header, "b.png", b"nope", path=path)
    assert bad.status_code == 400
    assert stored.exists()
    second = _post(client, vet_auth_header, "c.png", _image(), path=path)
    assert second.status_code == 200
    assert not stored.exists()
