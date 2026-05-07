from django.db.models import Count, Max, Prefetch, Q

from apps.catalog.models import Track

from .models import (
    FollowedArtist,
    Playlist,
    PlaylistCollaborator,
    PlaylistItem,
    RecentSearch,
    SavedAlbum,
    SavedTrack,
)


PLAYLIST_PREFETCH = (
    "owner",
)


def system_playlists(*, limit: int = 12) -> list[Playlist]:
    qs = (
        Playlist.objects.filter(is_system=True, is_public=True)
        .select_related(*PLAYLIST_PREFETCH)
        .annotate(items_count=Count("items"))
        .order_by("sort_order", "-updated_at")
    )
    return list(qs[:limit])


def _playlist_prefetch_items_qs():
    track_qs = Track.objects.select_related("artist", "album__artist")
    return PlaylistItem.objects.select_related("added_by").prefetch_related(
        Prefetch("track", queryset=track_qs),
    ).order_by("position", "pk")


def playlist_with_items(playlist_id: int) -> Playlist | None:
    return (
        Playlist.objects.filter(pk=playlist_id, is_public=True)
        .select_related(*PLAYLIST_PREFETCH)
        .prefetch_related(Prefetch("items", queryset=_playlist_prefetch_items_qs()))
        .first()
    )


def playlist_for_user(user_id: int | None, playlist_id: int) -> Playlist | None:
    qs = Playlist.objects.select_related(*PLAYLIST_PREFETCH).prefetch_related(
        Prefetch("items", queryset=_playlist_prefetch_items_qs()),
        "collaborators",
    )
    if user_id is None:
        qs = qs.filter(Q(is_public=True) | Q(is_system=True))
    else:
        qs = qs.filter(
            Q(is_public=True)
            | Q(is_system=True)
            | Q(owner_id=user_id)
            | Q(collaborators__user_id=user_id)
        ).distinct()
    return qs.filter(pk=playlist_id).first()


def my_playlists(user_id: int) -> list[Playlist]:
    qs = (
        Playlist.objects.filter(Q(owner_id=user_id) | Q(collaborators__user_id=user_id))
        .filter(is_system=False)
        .select_related(*PLAYLIST_PREFETCH)
        .annotate(items_count=Count("items", distinct=True))
        .order_by("-updated_at")
        .distinct()
    )
    return list(qs)


def saved_tracks_for_user(user_id: int, *, limit: int = 50, offset: int = 0) -> tuple[list[SavedTrack], int]:
    base = (
        SavedTrack.objects.filter(user_id=user_id)
        .select_related("track__artist", "track__album__artist")
        .order_by("-saved_at")
    )
    total = base.count()
    return list(base[offset : offset + limit]), total


def saved_track_ids_for_user(user_id: int) -> set[int]:
    return set(SavedTrack.objects.filter(user_id=user_id).values_list("track_id", flat=True))


def saved_albums_for_user(user_id: int, *, limit: int = 50, offset: int = 0) -> tuple[list[SavedAlbum], int]:
    base = (
        SavedAlbum.objects.filter(user_id=user_id)
        .select_related("album__artist")
        .order_by("-saved_at")
    )
    total = base.count()
    return list(base[offset : offset + limit]), total


def followed_artists_for_user(user_id: int, *, limit: int = 50, offset: int = 0) -> tuple[list[FollowedArtist], int]:
    base = (
        FollowedArtist.objects.filter(user_id=user_id)
        .select_related("artist")
        .order_by("-followed_at")
    )
    total = base.count()
    return list(base[offset : offset + limit]), total


def play_history_for_user(user_id: int, *, limit: int = 50, before_id: int | None = None) -> list:
    from apps.playback.models import PlayEvent

    qs = (
        PlayEvent.objects.filter(user_id=user_id)
        .select_related("track__artist", "track__album__artist")
        .order_by("-played_at", "-id")
    )
    if before_id is not None:
        qs = qs.filter(pk__lt=before_id)
    return list(qs[:limit])


def collaborators_for_playlist(playlist: Playlist) -> list[PlaylistCollaborator]:
    return list(
        PlaylistCollaborator.objects.filter(playlist=playlist)
        .select_related("user")
        .order_by("added_at")
    )


def recent_unique_tracks_for_user(user_id: int, *, limit: int = 12) -> list[Track]:
    last_played = (
        Track.objects.filter(play_events__user_id=user_id)
        .annotate(last_played_at=Max("play_events__played_at"))
        .filter(last_played_at__isnull=False)
        .select_related("artist", "album__artist")
        .order_by("-last_played_at")
    )
    return list(last_played[:limit])


def top_genre_slugs_for_user(user_id: int, *, limit: int = 3) -> list[str]:
    from apps.catalog.models import Genre

    qs = (
        Genre.objects.filter(tracks__play_events__user_id=user_id)
        .annotate(plays=Count("tracks__play_events"))
        .order_by("-plays", "name")
        .values_list("slug", flat=True)
    )
    return list(qs[:limit])


def tracks_in_genre(slug: str, *, limit: int = 24, exclude_user_id: int | None = None) -> list[Track]:
    qs = (
        Track.objects.filter(genres__slug=slug, is_unavailable=False)
        .select_related("artist", "album__artist")
        .order_by("-popularity", "-id")
    )
    if exclude_user_id is not None:
        qs = qs.exclude(play_events__user_id=exclude_user_id)
    return list(qs.distinct()[:limit])


def fallback_popular_tracks(*, limit: int = 24, exclude_ids: list[int] | None = None) -> list[Track]:
    qs = (
        Track.objects.filter(is_unavailable=False)
        .select_related("artist", "album__artist")
        .order_by("-popularity", "-id")
    )
    if exclude_ids:
        qs = qs.exclude(pk__in=exclude_ids)
    return list(qs[:limit])


def recent_searches_for_user(user_id: int, *, limit: int = 10) -> list[RecentSearch]:
    return list(
        RecentSearch.objects.filter(user_id=user_id)
        .order_by("-searched_at")[:limit]
    )


def is_track_saved(user_id: int, track_id: int) -> bool:
    return SavedTrack.objects.filter(user_id=user_id, track_id=track_id).exists()


def is_album_saved(user_id: int, album_id: int) -> bool:
    return SavedAlbum.objects.filter(user_id=user_id, album_id=album_id).exists()


def is_artist_followed(user_id: int, artist_id: int) -> bool:
    return FollowedArtist.objects.filter(user_id=user_id, artist_id=artist_id).exists()


def saved_album_ids_for_user(user_id: int) -> set[int]:
    return set(SavedAlbum.objects.filter(user_id=user_id).values_list("album_id", flat=True))


def followed_artist_ids_for_user(user_id: int) -> set[int]:
    return set(FollowedArtist.objects.filter(user_id=user_id).values_list("artist_id", flat=True))
