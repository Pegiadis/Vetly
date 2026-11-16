from fastapi.testclient import TestClient

from app.main import app


def test_unhandled_error_returns_greek_json_with_request_id():
    @app.get("/__boom")
    def boom():
        raise RuntimeError("secret internal detail")

    try:
        with TestClient(app, raise_server_exceptions=False) as c:
            r = c.get("/__boom")
    finally:
        app.router.routes = [x for x in app.router.routes if getattr(x, "path", "") != "/__boom"]

    assert r.status_code == 500
    body = r.json()
    assert "secret" not in r.text and "Traceback" not in r.text
    assert body["request_id"] and body["request_id"] in body["detail"]
    assert "σφάλμα" in body["detail"]
    assert r.headers["X-Request-ID"] == body["request_id"]


def test_validation_errors_keep_their_shape(client):
    r = client.post("/api/v1/auth/pet-owner/login", json={})
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert isinstance(detail, list) and "loc" in detail[0] and "msg" in detail[0]


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["Referrer-Policy"]


def test_authenticated_api_responses_are_not_cached(client, owner_auth_header):
    r = client.get("/api/v1/owner/pets", headers=owner_auth_header)
    assert r.status_code == 200
    assert r.headers["Cache-Control"] == "no-store"


def test_uploaded_files_served_with_nosniff(client, tmp_path):
    import io

    from PIL import Image

    from app.utils import upload

    (upload.UPLOAD_DIR / "owner").mkdir(parents=True, exist_ok=True)
    name = upload.UPLOAD_DIR / "owner" / "zz_hygiene_test.png"
    buf = io.BytesIO()
    Image.new("RGB", (2, 2)).save(buf, "PNG")
    name.write_bytes(buf.getvalue())
    try:
        r = client.get("/uploads/owner/zz_hygiene_test.png")
        assert r.status_code == 200
        assert r.headers["content-type"] == "image/png"
        assert r.headers["X-Content-Type-Options"] == "nosniff"
        assert client.get("/uploads/../app/main.py").status_code in (400, 404)
        assert client.get("/uploads/%2e%2e/app/main.py").status_code in (400, 404)
    finally:
        name.unlink(missing_ok=True)


def test_plain_list_endpoints_are_capped(db):
    from app.repositories.owner import MAX_LIST_ROWS, MAX_VET_LIST_ROWS

    assert MAX_LIST_ROWS <= 100 and MAX_VET_LIST_ROWS <= 200
