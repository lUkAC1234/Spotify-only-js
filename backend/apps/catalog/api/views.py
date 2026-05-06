import logging

from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Album, Artist, Source, Track
from apps.catalog.services import CatalogSyncService

from .serializers import (
    AlbumDetailSerializer,
    ArtistDetailSerializer,
    SearchResultSerializer,
    TrackSerializer,
)

logger = logging.getLogger(__name__)

DISCOVERY_CACHE_TTL = 60 * 30
MAX_DISCOVERY_LIMIT = 24


def _resolve_source(value: str | None) -> str:
    if not value:
        return Source.JAMENDO
    if value not in {Source.JAMENDO, Source.AUDIUS}:
        return Source.JAMENDO
    return value


class CatalogSearchView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        query = (request.query_params.get("q") or "").strip()
        if not query:
            return Response(SearchResultSerializer({"tracks": [], "artists": [], "albums": []}).data)

        source = _resolve_source(request.query_params.get("source"))
        kinds = self._parse_kinds(request.query_params.get("type"))
        limit = self._parse_int(request.query_params.get("limit"), default=24, maximum=50)
        offset = self._parse_int(request.query_params.get("offset"), default=0, maximum=1000)

        service = CatalogSyncService()
        try:
            synced = service.search(query, source=source, kinds=kinds, limit=limit, offset=offset)
        except ImproperlyConfigured as exc:
            logger.warning("Catalog provider not configured: %s", exc)
            return Response(
                {"code": "provider_not_configured", "message": "Music provider is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.exception("Catalog search failed: %s", exc)
            return Response(
                {"code": "provider_error", "message": "Music provider failed"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payload = SearchResultSerializer({
            "tracks": synced.tracks,
            "artists": synced.artists,
            "albums": synced.albums,
        }).data
        return Response(payload)

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


class PopularTracksView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        return _discovery_response(
            f"catalog:popular:{limit}",
            lambda: CatalogSyncService().popular_tracks(limit=limit),
        )


class NewReleasesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        limit = _parse_limit(request.query_params.get("limit"))
        return _discovery_response(
            f"catalog:new-releases:{limit}",
            lambda: CatalogSyncService().recent_tracks(limit=limit),
        )
