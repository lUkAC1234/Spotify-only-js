from django.contrib.auth import get_user_model
from django.db.models import Count

from apps.library.models import Playlist
from apps.playback.models import PlaybackState, PlayEvent

from .models import UserFollow

User = get_user_model()


def get_public_user(user_id: int):
    return (
        User.objects.filter(pk=user_id, is_active=True)
        .annotate(
            followers_count=Count("follower_relations", distinct=True),
            following_count=Count("following_relations", distinct=True),
        )
        .first()
    )


def public_playlists_for(user_id: int) -> list[Playlist]:
    return list(
        Playlist.objects.filter(owner_id=user_id, is_public=True, is_system=False)
        .annotate(items_count=Count("items"))
        .order_by("-updated_at")
    )


def is_following(follower_id: int, followed_id: int) -> bool:
    return UserFollow.objects.filter(follower_id=follower_id, followed_id=followed_id).exists()


def followers_of(user_id: int, *, limit: int = 50, offset: int = 0):
    qs = UserFollow.objects.filter(followed_id=user_id).select_related("follower").order_by("-followed_at")
    return list(qs[offset : offset + limit]), qs.count()


def following_of(user_id: int, *, limit: int = 50, offset: int = 0):
    qs = UserFollow.objects.filter(follower_id=user_id).select_related("followed").order_by("-followed_at")
    return list(qs[offset : offset + limit]), qs.count()


def followed_user_ids(user_id: int) -> list[int]:
    return list(UserFollow.objects.filter(follower_id=user_id).values_list("followed_id", flat=True))


def friends_listening(user_id: int):
    followed_ids = followed_user_ids(user_id)
    if not followed_ids:
        return []
    states = (
        PlaybackState.objects.filter(
            user_id__in=followed_ids,
            user__is_listening_public=True,
            track__isnull=False,
        )
        .select_related("user", "track__artist", "track__album__artist")
        .order_by("-updated_at")
    )
    return list(states)


def feed_for(user_id: int, *, limit: int = 30):
    followed_ids = followed_user_ids(user_id)
    if not followed_ids:
        return []
    plays = (
        PlayEvent.objects.filter(
            user_id__in=followed_ids,
            user__is_recent_history_public=True,
        )
        .select_related("user", "track__artist", "track__album__artist")
        .order_by("-played_at")
    )
    return list(plays[:limit])


def yearly_recap(user_id: int, year: int) -> dict:
    from apps.catalog.models import Genre

    play_qs = PlayEvent.objects.filter(
        user_id=user_id,
        played_at__year=year,
    )
    track_rows = (
        play_qs.values("track_id", "track__title", "track__artist__name", "track__cover")
        .annotate(plays=Count("id"))
        .order_by("-plays")[:10]
    )
    artist_rows = (
        play_qs.values("track__artist_id", "track__artist__name", "track__artist__image")
        .annotate(plays=Count("id"))
        .order_by("-plays")[:10]
    )
    genre_rows = (
        Genre.objects.filter(tracks__play_events__in=play_qs)
        .annotate(plays=Count("tracks__play_events"))
        .order_by("-plays")[:5]
        .values("id", "slug", "name", "plays")
    )
    return {
        "year": year,
        "topTracks": [
            {
                "id": row["track_id"],
                "title": row["track__title"],
                "artistName": row["track__artist__name"],
                "cover": row["track__cover"],
                "plays": row["plays"],
            }
            for row in track_rows
        ],
        "topArtists": [
            {
                "id": row["track__artist_id"],
                "name": row["track__artist__name"],
                "image": row["track__artist__image"],
                "plays": row["plays"],
            }
            for row in artist_rows
        ],
        "topGenres": [
            {"id": row["id"], "slug": row["slug"], "name": row["name"], "plays": row["plays"]}
            for row in genre_rows
        ],
        "totalPlays": play_qs.count(),
    }
