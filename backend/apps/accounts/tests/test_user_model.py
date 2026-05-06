import pytest
from django.contrib.auth import get_user_model

pytestmark = pytest.mark.django_db


def test_create_user_normalizes_email_and_hashes_password():
    User = get_user_model()
    user = User.objects.create_user(email="Alice@Example.COM", username="alice", password="strong-pass-1")

    assert user.email == "alice@example.com"
    assert user.username == "alice"
    assert user.check_password("strong-pass-1")
    assert not user.has_usable_password() is False
    assert user.is_active is True
    assert user.is_staff is False
    assert str(user) == "alice@example.com"
    assert user.safe_display_name == "alice"


def test_create_superuser_sets_flags():
    User = get_user_model()
    admin = User.objects.create_superuser(email="admin@example.com", username="admin", password="admin-pass-1")

    assert admin.is_staff is True
    assert admin.is_superuser is True
