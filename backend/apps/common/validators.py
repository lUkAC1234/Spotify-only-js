import re

from django.core.exceptions import ValidationError

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+$")
USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 30


def validate_username(value: str) -> None:
    if not isinstance(value, str):
        raise ValidationError("Username must be a string", code="username_invalid")

    if len(value) < USERNAME_MIN_LENGTH or len(value) > USERNAME_MAX_LENGTH:
        raise ValidationError(
            f"Username must be between {USERNAME_MIN_LENGTH} and {USERNAME_MAX_LENGTH} characters",
            code="username_length",
        )

    if not USERNAME_PATTERN.match(value):
        raise ValidationError(
            "Username may only contain letters, numbers, dots, underscores and hyphens",
            code="username_chars",
        )
