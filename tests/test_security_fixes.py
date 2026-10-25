"""High-confidence security regressions. Uses an in-memory stand-in for MongoDB."""

import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

os.environ["MONGO_URL"] = "mongodb://127.0.0.1:27017"
os.environ["DB_NAME"] = "security_test"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-at-least-32-characters"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"

import pytest
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

import server


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, key, direction):
        self.docs = sorted(self.docs, key=lambda doc: doc.get(key) or "", reverse=direction < 0)
        return self

    async def to_list(self, limit):
        return self.docs[:limit]


class FakeCollection:
    def __init__(self, unique_email=False):
        self.docs = []
        self.unique_email = unique_email

    def _copy(self, doc):
        copied = {}
        for key, value in doc.items():
            copied[key] = list(value) if isinstance(value, list) else value
        return copied

    def _matches(self, doc, query):
        for key, expected in query.items():
            current = doc.get(key)
            if isinstance(expected, dict):
                if "$ne" in expected:
                    banned = expected["$ne"]
                    if isinstance(current, list):
                        if banned in current:
                            return False
                    elif current == banned:
                        return False
                else:
                    return False
                continue
            if current != expected:
                return False
        return True

    def _project(self, doc, projection):
        copied = self._copy(doc)
        if projection:
            for key, include in projection.items():
                if include == 0:
                    copied.pop(key, None)
        return copied

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if self._matches(doc, query):
                return self._project(doc, projection)
        return None

    def find(self, query, projection=None):
        return FakeCursor([self._project(doc, projection) for doc in self.docs if self._matches(doc, query)])

    async def insert_one(self, doc):
        if self.unique_email and doc.get("email") is not None:
            if any(existing.get("email") == doc.get("email") for existing in self.docs):
                raise DuplicateKeyError("duplicate key error")
        self.docs.append(self._copy(doc))
        return type("InsertResult", (), {"inserted_id": "id"})()

    async def update_one(self, query, update, upsert=False):
        for index, doc in enumerate(self.docs):
            if self._matches(doc, query):
                updated = self._copy(doc)
                for key, value in update.get("$set", {}).items():
                    updated[key] = value
                for key, value in update.get("$inc", {}).items():
                    updated[key] = updated.get(key, 0) + value
                for key, value in update.get("$push", {}).items():
                    updated.setdefault(key, []).append(value)
                for key in update.get("$unset", {}):
                    updated.pop(key, None)
                self.docs[index] = updated
                return type("UpdateResult", (), {"modified_count": 1})()
        if upsert:
            self.docs.append(self._copy(update.get("$set", {})))
            return type("UpdateResult", (), {"modified_count": 1})()
        return type("UpdateResult", (), {"modified_count": 0})()

    async def find_one_and_update(self, query, update):
        for index, doc in enumerate(self.docs):
            if self._matches(doc, query):
                original = self._copy(doc)
                updated = self._copy(doc)
                for key, value in update.get("$set", {}).items():
                    updated[key] = value
                self.docs[index] = updated
                return original
        return None

    async def delete_one(self, query):
        for index, doc in enumerate(self.docs):
            if self._matches(doc, query):
                del self.docs[index]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, query):
        before = len(self.docs)
        self.docs = [doc for doc in self.docs if not self._matches(doc, query)]
        return type("DeleteResult", (), {"deleted_count": before - len(self.docs)})()

    async def count_documents(self, query):
        return sum(1 for doc in self.docs if self._matches(doc, query))

    async def create_index(self, key, unique=False):
        if key == "email" and unique:
            self.unique_email = True
        return key


class FakeDB:
    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = FakeCollection(unique_email=name == "users")
        return self._collections[name]


@pytest.fixture
def client():
    server.db = FakeDB()
    with TestClient(server.app) as test_client:
        yield test_client


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def register(client, email="user@example.com", password="test123456", name="Test User"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "name": name, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def create_claim(client, token):
    response = client.post(
        "/api/claims",
        json={
            "claim_number": "WCB-1",
            "injury_type": "TBI",
            "injury_group": "Group 1",
            "injury_date": "2024-01-01",
            "description": "Test injury",
            "status": "active",
        },
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_register_rejects_short_and_overlong_passwords(client):
    short = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "name": "Short", "password": "short"},
    )
    assert short.status_code == 422
    long_password = "a" * 73
    long = client.post(
        "/api/auth/register",
        json={"email": "long@example.com", "name": "Long", "password": long_password},
    )
    assert long.status_code == 422


def test_register_response_and_duplicate_email(client):
    first = register(client)
    assert "password" not in first["user"]
    second = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "name": "Other", "password": "test123456"},
    )
    assert second.status_code == 400


def test_duplicate_key_race_returns_400(client):
    register(client)

    async def hide_existing(*args, **kwargs):
        return None

    server.db.users.find_one = hide_existing
    response = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "name": "Race", "password": "test123456"},
    )
    assert response.status_code == 400


def test_login_without_password_is_401(client):
    server.db.users.docs.append({
        "user_id": "user_oauth",
        "email": "oauth@example.com",
        "name": "OAuth User",
        "password": None,
        "picture": "javascript:alert(1)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response = client.post(
        "/api/auth/login",
        json={"email": "oauth@example.com", "password": "test123456"},
    )
    assert response.status_code == 401


def test_login_strips_non_https_picture(client):
    password = "test123456"
    server.db.users.docs.append({
        "user_id": "user_pic",
        "email": "pic@example.com",
        "name": "Pic User",
        "password": server.hash_password(password),
        "picture": "javascript:alert(1)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response = client.post(
        "/api/auth/login",
        json={"email": "pic@example.com", "password": password},
    )
    assert response.status_code == 200, response.text
    assert response.json()["user"]["picture"] is None


def test_otp_verify_does_not_return_secrets(client):
    server.db.users.docs.append({
        "user_id": "user_otp",
        "email": "otp@example.com",
        "name": "OTP User",
        "password": server.hash_password("test123456"),
        "totp_secret": "JBSWY3DPEHPK3PXP",
        "backup_codes": ["hashed-code"],
        "pending_totp_secret": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    server.db.email_otps.docs.append({
        "email": "otp@example.com",
        "otp": "123456",
        "attempts": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
    })
    response = client.post(
        "/api/auth/otp/verify",
        json={"email": "otp@example.com", "otp_code": "123456"},
    )
    assert response.status_code == 200, response.text
    user = response.json()["user"]
    assert user["email"] == "otp@example.com"
    for field in ("password", "totp_secret", "backup_codes", "pending_totp_secret"):
        assert field not in user


def test_otp_is_stored_hashed_and_locks_out(client):
    sent = client.post("/api/auth/otp/send", params={"email": "lock@example.com"})
    assert sent.status_code == 200
    assert "otp_hash" not in sent.text
    stored = server.db.email_otps.docs[0]
    assert "otp_hash" in stored
    assert "otp" not in stored

    for _ in range(5):
        failed = client.post(
            "/api/auth/otp/verify",
            json={"email": "lock@example.com", "otp_code": "000000"},
        )
        assert failed.status_code == 400
    locked = client.post(
        "/api/auth/otp/verify",
        json={"email": "lock@example.com", "otp_code": "000000"},
    )
    assert locked.status_code == 400
    assert locked.json()["detail"] == "Too many attempts"


def test_wallet_challenge_must_match_and_address_is_hex(client):
    bad_address = client.get("/api/auth/wallet/message", params={"address": "0xnotanaddress"})
    assert bad_address.status_code == 400

    address = "0x" + "ab" * 20
    issued = client.get("/api/auth/wallet/message", params={"address": address})
    assert issued.status_code == 200
    nonce = issued.json()["nonce"]
    rejected = client.post(
        "/api/auth/wallet/verify",
        json={
            "address": address,
            "message": "sign this instead",
            "signature": "0x" + "11" * 65,
            "nonce": nonce,
        },
    )
    assert rejected.status_code == 401
    assert "challenge" in rejected.json()["detail"]
    assert server.db.wallet_nonces.docs[0]["used"] is False


def test_broken_session_cookie_is_unauthorized(client):
    server.db.user_sessions.docs.append({
        "session_token": "session_bad",
        "user_id": "missing",
        "expires_at": None,
    })
    response = client.get("/api/auth/me", cookies={"session_token": "session_bad"})
    assert response.status_code == 401


def test_cross_site_cookie_post_is_blocked(client):
    registered = register(client)
    claim_body = {
        "claim_number": "WCB-2",
        "injury_type": "TBI",
        "injury_group": "Group 1",
        "injury_date": "2024-01-02",
        "description": "Another injury",
    }
    blocked = client.post(
        "/api/claims",
        json=claim_body,
        cookies={"session_token": "session_victim"},
        headers={"Sec-Fetch-Site": "cross-site"},
    )
    assert blocked.status_code == 403

    allowed = client.post(
        "/api/claims",
        json=claim_body,
        cookies={"session_token": "session_victim"},
        headers={**auth_header(registered["token"]), "Sec-Fetch-Site": "cross-site"},
    )
    assert allowed.status_code == 200


def test_cors_does_not_reflect_arbitrary_origins(client):
    evil = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert evil.headers.get("access-control-allow-origin") != "https://evil.example"
    assert evil.headers.get("access-control-allow-origin") != "*"
    allowed = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_vote_cannot_be_repeated_and_period_is_bounded(client):
    registered = register(client)
    headers = auth_header(registered["token"])
    invalid = client.post(
        "/api/governance/proposals",
        json={"title": "Bad", "description": "Bad period", "category": "policy", "voting_period_days": 0},
        headers=headers,
    )
    assert invalid.status_code == 422

    created = client.post(
        "/api/governance/proposals",
        json={"title": "Help", "description": "More support", "category": "policy", "voting_period_days": 7},
        headers=headers,
    )
    assert created.status_code == 200, created.text
    proposal_id = created.json()["proposal_id"]
    first = client.post(f"/api/governance/proposals/{proposal_id}/vote", json={"vote": "for"}, headers=headers)
    second = client.post(f"/api/governance/proposals/{proposal_id}/vote", json={"vote": "for"}, headers=headers)
    assert first.status_code == 200
    assert second.status_code == 400
    stored = server.db.governance_proposals.docs[0]
    assert stored["votes_for"] == 1
    assert stored["voters"].count(registered["user"]["user_id"]) == 1


def test_letter_cannot_attach_to_another_users_claim(client):
    owner = register(client, email="owner@example.com")
    other = register(client, email="other@example.com")
    claim = create_claim(client, owner["token"])
    forged = client.post(
        "/api/letters/generate",
        json={"template_type": "interim_relief_request", "claim_id": claim["claim_id"]},
        headers=auth_header(other["token"]),
    )
    assert forged.status_code == 404
    timeline = client.get(
        f"/api/claims/{claim['claim_id']}/full-timeline",
        headers=auth_header(owner["token"]),
    )
    assert timeline.status_code == 200
    assert timeline.json()["stats"]["total_letters"] == 0


def test_invalid_timeline_date_and_oversized_upload(client):
    registered = register(client)
    headers = auth_header(registered["token"])
    claim = create_claim(client, registered["token"])
    bad_date = client.post(
        f"/api/claims/{claim['claim_id']}/timeline",
        data={"event_type": "note", "title": "Visit", "description": "Notes", "date": "yesterday"},
        headers=headers,
    )
    assert bad_date.status_code == 400

    upload = client.post(
        "/api/evidence/upload",
        data={"claim_id": claim["claim_id"], "description": "scan", "evidence_type": "medical"},
        files={"file": ("../../etc/passwd", b"a" * (10 * 1024 * 1024 + 1), "text/plain")},
        headers=headers,
    )
    assert upload.status_code == 413

    saved = client.post(
        "/api/evidence/upload",
        data={"claim_id": claim["claim_id"], "description": "scan", "evidence_type": "medical"},
        files={"file": ("../../report.txt", b"hello", None)},
        headers=headers,
    )
    assert saved.status_code == 200, saved.text
    body = saved.json()
    assert body["file_name"] == "report.txt"
    assert body["file_type"] == "text/plain"


def test_settings_reject_unexpected_values(client):
    registered = register(client)
    headers = auth_header(registered["token"])
    rejected = client.put("/api/settings", data={"theme": "<script>"}, headers=headers)
    assert rejected.status_code == 400
    saved = client.put(
        "/api/settings",
        data={"theme": "dark", "accent_color": "green", "text_size": "large", "notifications_enabled": "true"},
        headers=headers,
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["theme"] == "dark"


def test_safe_filename_strips_paths():
    assert server.safe_filename("../../etc/passwd") == "passwd"
    assert server.safe_filename(None) == "upload"
    assert server.safe_filename("..") == "upload"


def test_letter_markup_is_escaped_before_pdf():
    assert server.letter_pdf_paragraphs("Hello <b>x</b>\nline") == ["Hello &lt;b&gt;x&lt;/b&gt;<br/>line"]


def test_pdf_download_succeeds(client):
    registered = register(client, name="A <b>Name</b>")
    headers = auth_header(registered["token"])
    claim = create_claim(client, registered["token"])
    letter = client.post(
        "/api/letters/generate",
        json={"template_type": "interim_relief_request", "claim_id": claim["claim_id"]},
        headers=headers,
    )
    assert letter.status_code == 200, letter.text
    pdf = client.post(f"/api/letters/{letter.json()['letter_id']}/pdf", headers=headers)
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")


def test_claim_status_is_constrained(client):
    registered = register(client)
    response = client.post(
        "/api/claims",
        json={
            "claim_number": "WCB-3",
            "injury_group": "Group 2",
            "injury_date": "2024-02-01",
            "description": "Injury",
            "status": "deleted",
        },
        headers=auth_header(registered["token"]),
    )
    assert response.status_code == 422


def test_process_refuses_weak_jwt_secret_and_wildcard_cors():
    env = os.environ.copy()
    env["MONGO_URL"] = "mongodb://127.0.0.1:27017"
    env["DB_NAME"] = "security_test"
    env["JWT_SECRET_KEY"] = "short"
    env["CORS_ORIGINS"] = "*"
    refused = subprocess.run(
        [sys.executable, "-c", "import server"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
    )
    assert refused.returncode != 0
    assert "JWT_SECRET_KEY" in refused.stderr

    env["JWT_SECRET_KEY"] = "another-unique-test-secret-value-32b"
    env["CORS_ORIGINS"] = "*"
    wildcard = subprocess.run(
        [sys.executable, "-c", "import server; print(','.join(server._cors_origins))"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
    )
    assert wildcard.returncode == 0, wildcard.stderr
    assert wildcard.stdout.strip() == ""
