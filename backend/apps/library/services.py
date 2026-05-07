import logging
import secrets
from typing import Iterable

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.catalog.models import Album, Artist, Track

from .covers import regenerate_playlist_mosaic
from .models import (
    FollowedArtist,
    Playlist,
    PlaylistCollaborator,
    PlaylistItem,
    RecentSearch,
    SavedAlbum,
    SavedTrack,
)

RECENT_SEARCH_MAX = 10
PLAYLIST_TITLE_MAX = 120
PLAYLIST_DESCRIPTION_MAX = 320

logger = logging.getLogger(__name__)

SYSTEM_USERNAME = "system"
SYSTEM_EMAIL = "system@spotify.local"
SYSTEM_DISPLAY_NAME = "Spotify"

User = get_user_model()


def get_or_create_system_user():
    user = User.objects.filter(username=SYSTEM_USERNAME).first()
    if user is not None:
        return user

    user = User.objects.create(
        username=SYSTEM_USERNAME,
        email=SYSTEM_EMAIL,
        display_name=SYSTEM_DISPLAY_NAME,
        is_active=False,
        is_staff=False,
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])
    return user


@transaction.atomic
def upsert_system_playlist(
    *,
    title: str,
    description: str,
    cover: str,
    sort_order: int,
    tracks: Iterable[Track],
) -> Playlist:
    owner = get_or_create_system_user()
    playlist, _ = Playlist.objects.update_or_create(
        owner=owner,
        title=title,
        is_system=True,
        defaults={
            "description": description,
            "cover": cover or "",
            "sort_order": sort_order,
            "is_public": True,
            "is_collaborative": False,
        },
    )
    PlaylistItem.objects.filter(playlist=playlist).delete()
    items: list[PlaylistItem] = []
    seen_ids: set[int] = set()
    position = 1
    for track in tracks:
        if track.pk in seen_ids:
            continue
        seen_ids.add(track.pk)
        items.append(
            PlaylistItem(
                playlist=playlist,
                track=track,
                position=position,
                added_by=owner,
            )
        )
        position += 1
    if items:
        PlaylistItem.objects.bulk_create(items)
    return playlist


def derive_playlist_cover(tracks: Iterable[Track]) -> str:
    for track in tracks:
        cover = track.cover or (track.album.cover if track.album_id else "")
        if cover:
            return cover
    return ""


def make_seed_token() -> str:
    return secrets.token_hex(8)


@transaction.atomic
def push_recent_search(user_id: int, query: str) -> RecentSearch:
    normalized = (query or "").strip()[:120]
    if not normalized:
        raise ValueError("Empty query")

    entry, _ = RecentSearch.objects.update_or_create(
        user_id=user_id,
        query=normalized,
        defaults={"searched_at": timezone.now()},
    )

    extras = (
        RecentSearch.objects.filter(user_id=user_id)
        .order_by("-searched_at")
        .values_list("pk", flat=True)[RECENT_SEARCH_MAX:]
    )
    extra_ids = list(extras)
    if extra_ids:
        RecentSearch.objects.filter(pk__in=extra_ids).delete()
    return entry


def remove_recent_search(user_id: int, entry_id: int) -> bool:
    deleted, _ = RecentSearch.objects.filter(user_id=user_id, pk=entry_id).delete()
    return bool(deleted)


def clear_recent_searches(user_id: int) -> int:
    deleted, _ = RecentSearch.objects.filter(user_id=user_id).delete()
    return int(deleted or 0)


def save_track(user_id: int, track: Track) -> SavedTrack:
    entry, _ = SavedTrack.objects.get_or_create(user_id=user_id, track=track)
    return entry


def unsave_track(user_id: int, track_id: int) -> bool:
    deleted, _ = SavedTrack.objects.filter(user_id=user_id, track_id=track_id).delete()
    return bool(deleted)


def save_album(user_id: int, album: Album) -> SavedAlbum:
    entry, _ = SavedAlbum.objects.get_or_create(user_id=user_id, album=album)
    return entry


def unsave_album(user_id: int, album_id: int) -> bool:
    deleted, _ = SavedAlbum.objects.filter(user_id=user_id, album_id=album_id).delete()
    return bool(deleted)


def follow_artist(user_id: int, artist: Artist) -> FollowedArtist:
    entry, _ = FollowedArtist.objects.get_or_create(user_id=user_id, artist=artist)
    return entry


def unfollow_artist(user_id: int, artist_id: int) -> bool:
    deleted, _ = FollowedArtist.objects.filter(user_id=user_id, artist_id=artist_id).delete()
    return bool(deleted)


def can_edit_playlist(user_id: int | None, playlist: Playlist) -> bool:
    if user_id is None:
        return False
    if playlist.is_system:
        return False
    if playlist.owner_id == user_id:
        return True
    if playlist.is_collaborative and PlaylistCollaborator.objects.filter(
        playlist=playlist, user_id=user_id
    ).exists():
        return True
    return False


def assert_can_edit_playlist(user_id: int | None, playlist: Playlist) -> None:
    if not can_edit_playlist(user_id, playlist):
        raise PermissionDenied("You cannot edit this playlist")


def can_view_playlist(user_id: int | None, playlist: Playlist) -> bool:
    if playlist.is_public or playlist.is_system:
        return True
    if user_id is None:
        return False
    if playlist.owner_id == user_id:
        return True
    return PlaylistCollaborator.objects.filter(playlist=playlist, user_id=user_id).exists()


@transaction.atomic
def create_user_playlist(user_id: int, title: str, *, description: str = "", is_public: bool = True) -> Playlist:
    cleaned_title = (title or "").strip()[:PLAYLIST_TITLE_MAX] or "New Playlist"
    cleaned_description = (description or "").strip()[:PLAYLIST_DESCRIPTION_MAX]
    playlist = Playlist.objects.create(
        owner_id=user_id,
        title=cleaned_title,
        description=cleaned_description,
        is_public=is_public,
        is_collaborative=False,
        is_system=False,
    )
    return playlist


@transaction.atomic
def update_user_playlist(
    user_id: int,
    playlist: Playlist,
    *,
    title: str | None = None,
    description: str | None = None,
    is_public: bool | None = None,
    is_collaborative: bool | None = None,
) -> Playlist:
    assert_can_edit_playlist(user_id, playlist)
    fields: list[str] = []
    if title is not None:
        playlist.title = (title or "").strip()[:PLAYLIST_TITLE_MAX] or playlist.title
        fields.append("title")
    if description is not None:
        playlist.description = (description or "").strip()[:PLAYLIST_DESCRIPTION_MAX]
        fields.append("description")
    if is_public is not None and playlist.owner_id == user_id:
        playlist.is_public = bool(is_public)
        fields.append("is_public")
    if is_collaborative is not None and playlist.owner_id == user_id:
        playlist.is_collaborative = bool(is_collaborative)
        fields.append("is_collaborative")
    if fields:
        fields.append("updated_at")
        playlist.save(update_fields=fields)
    return playlist


@transaction.atomic
def delete_user_playlist(user_id: int, playlist: Playlist) -> None:
    if playlist.is_system:
        raise PermissionDenied("System playlists cannot be deleted")
    if playlist.owner_id != user_id:
        raise PermissionDenied("Only the owner can delete a playlist")
    playlist.delete()


@transaction.atomic
def add_tracks_to_playlist(user_id: int, playlist: Playlist, tracks: Iterable[Track]) -> list[PlaylistItem]:
    assert_can_edit_playlist(user_id, playlist)
    last_position = (
        PlaylistItem.objects.filter(playlist=playlist).aggregate(value=Max("position"))["value"] or 0
    )
    existing_track_ids = set(
        PlaylistItem.objects.filter(playlist=playlist).values_list("track_id", flat=True)
    )
    items: list[PlaylistItem] = []
    next_position = int(last_position) + 1
    for track in tracks:
        if track.pk in existing_track_ids:
            continue
        existing_track_ids.add(track.pk)
        items.append(
            PlaylistItem(
                playlist=playlist,
                track=track,
                position=next_position,
                added_by_id=user_id,
            )
        )
        next_position += 1
    if items:
        PlaylistItem.objects.bulk_create(items)
        playlist.save(update_fields=["updated_at"])
        regenerate_playlist_mosaic(playlist)
    return items


def _renumber_playlist(playlist: Playlist) -> None:
    items = list(PlaylistItem.objects.filter(playlist=playlist).order_by("position", "pk"))
    if not items:
        return
    offset = 1_000_000
    for index, item in enumerate(items, start=1):
        PlaylistItem.objects.filter(pk=item.pk).update(position=offset + index)
    for index, item in enumerate(items, start=1):
        PlaylistItem.objects.filter(pk=item.pk).update(position=index)


@transaction.atomic
def remove_playlist_item(user_id: int, playlist: Playlist, item_id: int) -> bool:
    assert_can_edit_playlist(user_id, playlist)
    target = PlaylistItem.objects.filter(playlist=playlist, pk=item_id).first()
    if not target:
        return False
    target.delete()
    _renumber_playlist(playlist)
    playlist.save(update_fields=["updated_at"])
    regenerate_playlist_mosaic(playlist)
    return True


@transaction.atomic
def move_playlist_item(user_id: int, playlist: Playlist, item_id: int, new_position: int) -> PlaylistItem:
    assert_can_edit_playlist(user_id, playlist)
    target = PlaylistItem.objects.filter(playlist=playlist, pk=item_id).first()
    if not target:
        raise ValueError("Item not found")
    items = list(PlaylistItem.objects.filter(playlist=playlist).order_by("position", "pk"))
    items = [item for item in items if item.pk != target.pk]
    insert_at = max(0, min(int(new_position) - 1, len(items)))
    items.insert(insert_at, target)
    offset = 1_000_000
    for index, item in enumerate(items, start=1):
        PlaylistItem.objects.filter(pk=item.pk).update(position=offset + index)
    for index, item in enumerate(items, start=1):
        PlaylistItem.objects.filter(pk=item.pk).update(position=index)
    target.refresh_from_db()
    playlist.save(update_fields=["updated_at"])
    return target


@transaction.atomic
def add_collaborator(user_id: int, playlist: Playlist, target_user_id: int) -> PlaylistCollaborator:
    if playlist.owner_id != user_id:
        raise PermissionDenied("Only the owner can manage collaborators")
    if target_user_id == playlist.owner_id:
        raise ValueError("Owner cannot be added as collaborator")
    if not playlist.is_collaborative:
        playlist.is_collaborative = True
        playlist.save(update_fields=["is_collaborative", "updated_at"])
    entry, _ = PlaylistCollaborator.objects.get_or_create(playlist=playlist, user_id=target_user_id)
    return entry


@transaction.atomic
def remove_collaborator(user_id: int, playlist: Playlist, target_user_id: int) -> bool:
    if playlist.owner_id != user_id and target_user_id != user_id:
        raise PermissionDenied("Cannot remove other collaborators")
    deleted, _ = PlaylistCollaborator.objects.filter(playlist=playlist, user_id=target_user_id).delete()
    return bool(deleted)
