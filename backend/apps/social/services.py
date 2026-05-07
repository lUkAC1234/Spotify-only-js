from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import UserFollow

User = get_user_model()


def follow_user(follower_id: int, followed_id: int) -> UserFollow:
    if follower_id == followed_id:
        raise ValidationError("Cannot follow yourself")
    target = User.objects.filter(pk=followed_id, is_active=True).first()
    if target is None:
        raise ValidationError("User not found")
    entry, _ = UserFollow.objects.get_or_create(follower_id=follower_id, followed_id=followed_id)
    return entry


def unfollow_user(follower_id: int, followed_id: int) -> bool:
    deleted, _ = UserFollow.objects.filter(
        follower_id=follower_id, followed_id=followed_id
    ).delete()
    return bool(deleted)


@transaction.atomic
def update_privacy(user, *, is_profile_public=None, is_listening_public=None, is_recent_history_public=None):
    fields: list[str] = []
    if is_profile_public is not None:
        user.is_profile_public = bool(is_profile_public)
        fields.append("is_profile_public")
    if is_listening_public is not None:
        user.is_listening_public = bool(is_listening_public)
        fields.append("is_listening_public")
    if is_recent_history_public is not None:
        user.is_recent_history_public = bool(is_recent_history_public)
        fields.append("is_recent_history_public")
    if fields:
        user.save(update_fields=fields)
    return user
