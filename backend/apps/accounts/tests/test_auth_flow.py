import pytest
from django.contrib.auth import get_user_model
from django.test import Client

User = get_user_model()


def _make_client() -> Client:
    return Client(enforce_csrf_checks=False)


@pytest.mark.django_db
def test_register_creates_user_and_session():
    client = _make_client()
    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "alice@example.com",
            "username": "alice",
            "password": "Strongpass-1",
            "displayName": "Alice",
        },
        content_type="application/json",
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "alice@example.com"
    assert payload["username"] == "alice"
    assert payload["displayName"] == "Alice"
    assert User.objects.filter(email="alice@example.com").exists()

    me = client.get("/api/v1/auth/me/")
    assert me.status_code == 200
    assert me.json()["username"] == "alice"


@pytest.mark.django_db
def test_register_rejects_duplicate_email():
    User.objects.create_user(email="bob@example.com", username="bob", password="Strongpass-1")
    response = _make_client().post(
        "/api/v1/auth/register/",
        data={"email": "bob@example.com", "username": "bob2", "password": "Strongpass-2"},
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json()["code"] == "validation_error"


@pytest.mark.django_db
def test_login_with_email_and_username_then_logout():
    User.objects.create_user(email="carol@example.com", username="carol", password="Strongpass-1")

    client = _make_client()
    by_email = client.post(
        "/api/v1/auth/login/",
        data={"identifier": "carol@example.com", "password": "Strongpass-1"},
        content_type="application/json",
    )
    assert by_email.status_code == 200
    assert by_email.json()["username"] == "carol"

    by_username = _make_client().post(
        "/api/v1/auth/login/",
        data={"identifier": "carol", "password": "Strongpass-1"},
        content_type="application/json",
    )
    assert by_username.status_code == 200

    logout_resp = client.post("/api/v1/auth/logout/")
    assert logout_resp.status_code == 204
    assert client.get("/api/v1/auth/me/").status_code == 401


@pytest.mark.django_db
def test_login_rejects_bad_credentials():
    User.objects.create_user(email="dan@example.com", username="dan", password="Strongpass-1")
    response = _make_client().post(
        "/api/v1/auth/login/",
        data={"identifier": "dan@example.com", "password": "wrong"},
        content_type="application/json",
    )
    assert response.status_code == 401
    assert response.json()["code"] == "authentication_failed"


@pytest.mark.django_db
def test_me_requires_auth():
    assert _make_client().get("/api/v1/auth/me/").status_code == 401


@pytest.mark.django_db
def test_csrf_endpoint_sets_cookie():
    response = _make_client().get("/api/v1/auth/csrf/")
    assert response.status_code == 200
    assert "csrfToken" in response.json()
    assert "csrftoken" in response.cookies


@pytest.mark.django_db
def test_update_display_name():
    User.objects.create_user(email="erin@example.com", username="erin", password="Strongpass-1")
    client = _make_client()
    client.post(
        "/api/v1/auth/login/",
        data={"identifier": "erin@example.com", "password": "Strongpass-1"},
        content_type="application/json",
    )
    response = client.patch(
        "/api/v1/auth/me/",
        data={"displayName": "Erin Renamed"},
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["displayName"] == "Erin Renamed"


@pytest.mark.django_db
def test_change_password_invalidates_old():
    User.objects.create_user(email="frank@example.com", username="frank", password="Strongpass-1")
    client = _make_client()
    client.post(
        "/api/v1/auth/login/",
        data={"identifier": "frank@example.com", "password": "Strongpass-1"},
        content_type="application/json",
    )
    change = client.post(
        "/api/v1/auth/me/password/",
        data={"currentPassword": "Strongpass-1", "newPassword": "Newstrong-2"},
        content_type="application/json",
    )
    assert change.status_code == 204

    bad_login = _make_client().post(
        "/api/v1/auth/login/",
        data={"identifier": "frank@example.com", "password": "Strongpass-1"},
        content_type="application/json",
    )
    assert bad_login.status_code == 401
    good_login = _make_client().post(
        "/api/v1/auth/login/",
        data={"identifier": "frank@example.com", "password": "Newstrong-2"},
        content_type="application/json",
    )
    assert good_login.status_code == 200
