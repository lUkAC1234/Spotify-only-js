from django.db.models import Count

from .models import Album, Artist, Track


def top_tracks_for_artist(artist_id: int, *, limit: int = 5) -> list[Track]:
    qs = (
        Track.objects.filter(artist_id=artist_id, is_unavailable=False)
        .select_related("artist", "album__artist")
        .order_by("-popularity", "-id")
    )
    return list(qs[:limit])


def discography_for_artist(artist_id: int) -> list[Album]:
    return list(
        Album.objects.filter(artist_id=artist_id)
        .select_related("artist")
        .order_by("-release_date", "title")
    )


def related_artists(artist: Artist, *, limit: int = 6) -> list[Artist]:
    genre_ids = list(
        Track.objects.filter(artist_id=artist.pk)
        .values_list("genres", flat=True)
        .distinct()
    )
    genre_ids = [gid for gid in genre_ids if gid]
    if not genre_ids:
        qs = (
            Artist.objects.exclude(pk=artist.pk)
            .order_by("-monthly_listeners", "name")
        )
        return list(qs[:limit])

    qs = (
        Artist.objects.exclude(pk=artist.pk)
        .filter(tracks__genres__in=genre_ids)
        .annotate(overlap=Count("tracks__genres", distinct=True))
        .order_by("-overlap", "-monthly_listeners", "name")
        .distinct()
    )
    return list(qs[:limit])


def related_albums(album: Album, *, limit: int = 6) -> list[Album]:
    genre_ids = list(
        Track.objects.filter(album_id=album.pk)
        .values_list("genres", flat=True)
        .distinct()
    )
    genre_ids = [gid for gid in genre_ids if gid]

    qs = (
        Album.objects.exclude(pk=album.pk)
        .filter(artist_id=album.artist_id)
        .select_related("artist")
        .order_by("-release_date", "title")
    )
    by_artist = list(qs[:limit])
    if len(by_artist) >= limit:
        return by_artist

    seen = {item.pk for item in by_artist}
    if genre_ids:
        more = (
            Album.objects.exclude(pk__in=seen | {album.pk})
            .filter(tracks__genres__in=genre_ids)
            .select_related("artist")
            .annotate(overlap=Count("tracks__genres", distinct=True))
            .order_by("-overlap", "-release_date", "title")
            .distinct()
        )
        for candidate in more:
            if candidate.pk in seen:
                continue
            seen.add(candidate.pk)
            by_artist.append(candidate)
            if len(by_artist) >= limit:
                break
    return by_artist
