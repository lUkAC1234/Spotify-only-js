import hashlib
import logging

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Album, Artist, Genre, Source, Track
from apps.catalog.services import (
    CatalogSyncService,
    normalize_search_query,
    search_albums_local,
    search_artists_local,
    search_tracks_local,
)
from apps.library.selectors import (
    fallback_popular_tracks,
    playlist_with_items,
    recent_searches_for_user,
    recent_unique_tracks_for_user,
    system_playlists,
    top_genre_slugs_for_user,
    tracks_in_genre,
)
from apps.library.services import (
    clear_recent_searches,
    push_recent_search,
    remove_recent_search,
)

from .serializers import (
    AlbumDetailSerializer,
    ArtistDetailSerializer,
    FeaturedPlaylistDetailSerializer,
    FeaturedPlaylistSerializer,
    GenreSerializer,
    RecentSearchInputSerializer,
    RecentSearchSerializer,
    SearchResultSerializer,
    TrackSerializer,
)

logger = logging.getLogger(__name__)

DISCOVERY_CACHE_TTL = 60 * 30
MAX_DISCOVERY_LIMIT = 24
ALLOWED_SOURCES: frozenset[str] = frozenset({Source.JAMENDO, Source.AUDIUS, Source.YANDEX})


def _default_source() -> str:
    configured = (getattr(settings, "DEFAULT_CATALOG_SOURCE", "") or "").strip().lower()
    if configured in ALLOWED_SOURCES:
        if configured == Source.YANDEX and not getattr(settings, "YANDEX_MUSIC_TOKEN", ""):
            return Source.JAMENDO
        return configured
    return Source.JAMENDO


def _resolve_source(value: str | None) -> str:
    if not value:
        return _default_source()
    cleaned = value.strip().lower()
    if cleaned not in ALLOWED_SOURCES:
        return _default_source()
    if cleaned == Source.YANDEX and not getattr(settings, "YANDEX_MUSIC_TOKEN", ""):
        return _default_source()
    return cleaned


WEAK_MATCH_THRESHOLD = 4
SEARCH_CACHE_TTL = 60
SEARCH_RESULT_LIMIT_SECONDARY = 12


class CatalogSearchView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        raw_query = request.query_params.get("q") or ""
        query = normalize_search_query(raw_query)
        if not query:
            return Response(self._empty_payload())

        source = _resolve_source(request.query_params.get("source"))
        kinds = self._parse_kinds(request.query_params.get("type"))
        limit = self._parse_int(request.query_params.get("limit"), default=24, maximum=50)
        offset = self._parse_int(request.query_params.get("offset"), default=0, maximum=1000)

        cache_key = self._cache_key(query, kinds, source, limit, offset)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        payload = self._build_payload(query, kinds, source, limit, offset)
        cache.set(cache_key, payload, SEARCH_CACHE_TTL)
        return Response(payload)

    def _build_payload(
        self,
        query: str,
        kinds: tuple[str, ...],
        source: str,
        limit: int,
        offset: int,
    ) -> dict:
        local_tracks, total_tracks = (
            search_tracks_local(query, limit=limit, offset=offset)
            if "track" in kinds
            else ([], 0)
        )
        is_first_page = offset == 0
        local_artists = (
            search_artists_local(query, limit=SEARCH_RESULT_LIMIT_SECONDARY)
            if "artist" in kinds and is_first_page
            else []
        )
        local_albums = (
            search_albums_local(query, limit=SEARCH_RESULT_LIMIT_SECONDARY)
            if "album" in kinds and is_first_page
            else []
        )

        if is_first_page and self._is_weak_match(local_tracks, local_artists, local_albums):
            self._sync_upstream(query, source=source, kinds=kinds, limit=limit)
            if "track" in kinds:
                local_tracks, total_tracks = search_tracks_local(query, limit=limit, offset=offset)
            if "artist" in kinds:
                local_artists = search_artists_local(query, limit=SEARCH_RESULT_LIMIT_SECONDARY)
            if "album" in kinds:
                local_albums = search_albums_local(query, limit=SEARCH_RESULT_LIMIT_SECONDARY)

        payload = SearchResultSerializer({
            "tracks": local_tracks,
            "artists": local_artists,
            "albums": local_albums,
        }).data
        payload["totalTracks"] = int(total_tracks)
        payload["limit"] = limit
        payload["offset"] = offset
        payload["hasMore"] = offset + len(local_tracks) < total_tracks
        return payload

    @staticmethod
    def _is_weak_match(tracks: list, artists: list, albums: list) -> bool:
        return (len(tracks) + len(artists) + len(albums)) < WEAK_MATCH_THRESHOLD

    @staticmethod
    def _sync_upstream(query: str, *, source: str, kinds: tuple[str, ...], limit: int) -> None:
        try:
            CatalogSyncService().search(query, source=source, kinds=kinds, limit=limit)
        except ImproperlyConfigured as exc:
            logger.warning("Catalog provider not configured: %s", exc)
        except Exception as exc:
            logger.warning("Catalog upstream search failed: %s", exc)

    @staticmethod
    def _empty_payload() -> dict:
        empty = SearchResultSerializer({"tracks": [], "artists": [], "albums": []}).data
        empty["totalTracks"] = 0
        empty["limit"] = 0
        empty["offset"] = 0
        empty["hasMore"] = False
        return empty

    @staticmethod
    def _cache_key(query: str, kinds: tuple[str, ...], source: str, limit: int, offset: int) -> str:
        digest = hashlib.blake2s(query.lower().encode("utf-8"), digest_size=12).hexdigest()
        kinds_part = ",".join(kinds)
        return f"catalog:search:{source}:{kinds_part}:{limit}:{offset}:{digest}"

    @staticmethod
    def _parse_kinds(raw: str | None) -> tuple[str, ...]:
        if not raw:
            return ("track", "artist", "album")
        wanted = {p.strip() for p in raw.split(",") if p.strip()}
        return tuple(k for k in ("track", "artist", "album") if k in wanted) or ("track",)

    @staticmethod
    def _parse_int(raw: str | None, *, default: int, maximum: int) -> int:
        try:
            value = int(raw) if raw is not None else default
        except (TypeError, ValueError):
            value = default
        return max(0, min(value, maximum))


class TrackDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, track_id: int) -> Response:
        service = CatalogSyncService()
        try:
            track = service.get_or_sync_track(track_id)
        except ImproperlyConfigured:
            track = Track.objects.select_related("artist", "album").filter(pk=track_id).first()

        if not track:
            return Response(
                {"code": "not_found", "message": "Track not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TrackSerializer(track).data)


class AlbumDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, album_id: int) -> Response:
        service = CatalogSyncService()
        try:
            album = service.get_or_sync_album(album_id)
        except ImproperlyConfigured:
            album = Album.objects.select_related("artist").filter(pk=album_id).first()
        if not album:
            return Response(
                {"code": "not_found", "message": "Album not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(AlbumDetailSerializer(album).data)


class ArtistDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, artist_id: int) -> Response:
        service = CatalogSyncService()
        try:
            artist = service.get_or_sync_artist(artist_id)
        except ImproperlyConfigured:
            artist = Artist.objects.filter(pk=artist_id).first()
        if not artist:
            return Response(
                {"code": "not_found", "message": "Artist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ArtistDetailSerializer(artist).data)


def _parse_limit(value: str | None, default: int = 12) -> int:
    try:
        n = int(value) if value is not None else default
    except (TypeError, ValueError):
        n = default
    return max(1, min(n, MAX_DISCOVERY_LIMIT))


def _discovery_response(cache_key: str, fetch) -> Response:
    cached = cache.get(cache_key)
    if cached is not None:
        return Response({"items": cached})

    try:
        tracks = fetch()
    except ImproperlyConfigured as exc:
        logger.warning("Catalog provider not configured: %s", exc)
        return Response(
            {"code": "provider_not_configured", "message": "Music provider is not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as exc:
        logger.exception("Discovery fetch failed: %s", exc)
        return Response(
            {"code": "provider_error", "message": "Music provider failed"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    payload = TrackSerializer(tracks, many=True).data
    cache.set(cache_key, payload, DISCOVERY_CACHE_TTL)
    return Response({"items": payload})


def _available_aggregation_sources() -> list[str]:
    sources: list[str] = []
    if getattr(settings, "JAMENDO_CLIENT_ID", ""):
        sources.append(Source.JAMENDO)
    sources.append(Source.AUDIUS)
    if getattr(settings, "YANDEX_MUSIC_TOKEN", ""):
        sources.append(Source.YANDEX)
    return sources


def _round_robin_merge(buckets: list[list[Track]], limit: int) -> list[Track]:
    merged: list[Track] = []
    seen_keys: set[tuple[str, str]] = set()
    indices = [0] * len(buckets)
    while len(merged) < limit:
        progressed = False
        for bucket_index, bucket in enumerate(buckets):
            cursor = indices[bucket_index]
            if cursor >= len(bucket):
                continue
            track = bucket[cursor]
            indices[bucket_index] = cursor + 1
            progressed = True
            key = (track.source, track.source_id)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            merged.append(track)
            if len(merged) >= limit:
                break
        if not progressed:
            break
    return merged


def _aggregated_discovery_response(cache_key: str, *, limit: int, fetch_for_source) -> Response:
    cached = cache.get(cache_key)
    if cached is not None:
        return Response({"items": cached})

    service = CatalogSyncService()
    buckets: list[list[Track]] = []
    per_source = max(limit, 6)

    for source in _available_aggregation_sources():
        try:
            tracks = fetch_for_source(service, source, per_source)
        except ImproperlyConfigured as exc:
            logger.info("Skipping %s in aggregation: %s", source, exc)
            continue
        except Exception as exc:
            logger.warning("Aggregated fetch for %s failed: %s", source, exc)
            continue
        if tracks:
            buckets.append(list(tracks))

    if not buckets:
        return Response(
            {"code": "provider_not_configured", "message": "No music provider is configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    merged = _round_robin_merge(buckets, limit)
    payload = TrackSerializer(merged, many=True).data
    cache.set(cache_key, payload, DISCOVERY_CACHE_TTL)
    return Response({"items": payload})


def _wants_aggregation(query_source: str | None) -> bool:
    if query_source:
        return False
    return not (getattr(settings, "DEFAULT_CATALOG_SOURCE", "") or "").strip()


class PopularTracksView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        query_source = request.query_params.get("source")
        if _wants_aggregation(query_source):
            return _aggregated_discovery_response(
                f"catalog:popular:agg:{limit}",
                limit=limit,
                fetch_for_source=lambda service, src, n: service.popular_tracks(source=src, limit=n),
            )
        source = _resolve_source(query_source)
        return _discovery_response(
            f"catalog:popular:{source}:{limit}",
            lambda: CatalogSyncService().popular_tracks(source=source, limit=limit),
        )


class NewReleasesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        query_source = request.query_params.get("source")
        if _wants_aggregation(query_source):
            return _aggregated_discovery_response(
                f"catalog:new-releases:agg:{limit}",
                limit=limit,
                fetch_for_source=lambda service, src, n: service.recent_tracks(source=src, limit=n),
            )
        source = _resolve_source(query_source)
        return _discovery_response(
            f"catalog:new-releases:{source}:{limit}",
            lambda: CatalogSyncService().recent_tracks(source=source, limit=limit),
        )


class GenresView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        cache_key = "catalog:genres"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({"items": cached})

        qs = (
            Genre.objects.annotate(track_count=Count("tracks"))
            .filter(track_count__gt=0)
            .order_by("-track_count", "name")
        )
        payload = GenreSerializer(qs[:48], many=True).data
        cache.set(cache_key, payload, DISCOVERY_CACHE_TTL)
        return Response({"items": payload})


class GenreTrackingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, slug: str) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        source = _resolve_source(request.query_params.get("source"))
        cache_key = f"catalog:genre:{source}:{slug}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({"slug": slug, "items": cached})

        tracks = tracks_in_genre(slug, limit=limit)
        if not tracks:
            try:
                tracks = CatalogSyncService().tracks_by_tag(slug, source=source, limit=limit)
            except ImproperlyConfigured:
                pass
            except Exception as exc:
                logger.warning("Genre fetch failed for %s: %s", slug, exc)

        payload = TrackSerializer(tracks, many=True).data
        cache.set(cache_key, payload, DISCOVERY_CACHE_TTL)
        return Response({"slug": slug, "items": payload})


class FeaturedPlaylistsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        cache_key = "catalog:featured-playlists"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({"items": cached})

        playlists = system_playlists(limit=12)
        payload = FeaturedPlaylistSerializer(playlists, many=True).data
        cache.set(cache_key, payload, DISCOVERY_CACHE_TTL)
        return Response({"items": payload})


class FeaturedPlaylistDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, playlist_id: int) -> Response:
        playlist = playlist_with_items(playlist_id)
        if not playlist:
            return Response(
                {"code": "not_found", "message": "Playlist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FeaturedPlaylistDetailSerializer(playlist).data)


class RecentlyPlayedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        tracks = recent_unique_tracks_for_user(request.user.id, limit=limit)
        return Response({"items": TrackSerializer(tracks, many=True).data})


class DailyMixView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"), default=18)
        slugs = top_genre_slugs_for_user(request.user.id, limit=3)

        tracks: list[Track] = []
        seen_ids: set[int] = set()

        for slug in slugs:
            for track in tracks_in_genre(slug, limit=limit):
                if track.pk in seen_ids:
                    continue
                seen_ids.add(track.pk)
                tracks.append(track)
                if len(tracks) >= limit:
                    break
            if len(tracks) >= limit:
                break

        if len(tracks) < limit:
            for track in fallback_popular_tracks(limit=limit, exclude_ids=list(seen_ids)):
                if track.pk in seen_ids:
                    continue
                tracks.append(track)
                seen_ids.add(track.pk)
                if len(tracks) >= limit:
                    break

        return Response({"items": TrackSerializer(tracks, many=True).data})


class RecentSearchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        entries = recent_searches_for_user(request.user.id, limit=10)
        return Response({"items": RecentSearchSerializer(entries, many=True).data})

    def post(self, request) -> Response:
        serializer = RecentSearchInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            entry = push_recent_search(request.user.id, serializer.validated_data["query"])
        except ValueError:
            return Response(
                {"code": "validation_error", "message": "Query cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(RecentSearchSerializer(entry).data, status=status.HTTP_201_CREATED)

    def delete(self, request) -> Response:
        clear_recent_searches(request.user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecentSearchDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, entry_id: int) -> Response:
        removed = remove_recent_search(request.user.id, entry_id)
        if not removed:
            return Response(
                {"code": "not_found", "message": "Search entry not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecommendationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"), default=18)
        seed_genres = self._parse_seed_genres(request.query_params.get("seed_genres"))

        if not seed_genres and request.user.is_authenticated:
            seed_genres = top_genre_slugs_for_user(request.user.id, limit=3)

        if seed_genres:
            tracks: list[Track] = []
            seen_ids: set[int] = set()
            for slug in seed_genres:
                for track in tracks_in_genre(slug, limit=limit):
                    if track.pk in seen_ids:
                        continue
                    seen_ids.add(track.pk)
                    tracks.append(track)
                    if len(tracks) >= limit:
                        break
                if len(tracks) >= limit:
                    break
            payload = TrackSerializer(tracks, many=True).data
            return Response({"seedGenres": seed_genres, "items": payload})

        query_source = request.query_params.get("source")
        if _wants_aggregation(query_source):
            return _aggregated_discovery_response(
                f"catalog:popular:agg:{limit}",
                limit=limit,
                fetch_for_source=lambda service, src, n: service.popular_tracks(source=src, limit=n),
            )
        source = _resolve_source(query_source)
        return _discovery_response(
            f"catalog:popular:{source}:{limit}",
            lambda: CatalogSyncService().popular_tracks(source=source, limit=limit),
        )

    @staticmethod
    def _parse_seed_genres(raw: str | None) -> list[str]:
        if not raw:
            return []
        parts = [p.strip().lower() for p in raw.split(",")]
        return [p for p in parts if p]
