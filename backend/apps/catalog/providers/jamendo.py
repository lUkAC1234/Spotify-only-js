from typing import Any, Optional

import httpx
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .base import AlbumDTO, ArtistDTO, MusicProvider, SearchResultDTO, TrackDTO

JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0"
JAMENDO_DEFAULT_TIMEOUT = 10.0


class JamendoProvider(MusicProvider):
    source = "jamendo"

    def __init__(self, client_id: Optional[str] = None, *, timeout: float = JAMENDO_DEFAULT_TIMEOUT) -> None:
        resolved = client_id or getattr(settings, "JAMENDO_CLIENT_ID", "") or ""
        if not resolved:
            raise ImproperlyConfigured("JAMENDO_CLIENT_ID is not set")
        self._client_id = resolved
        self._client = httpx.Client(base_url=JAMENDO_BASE_URL, timeout=timeout)

    def __del__(self) -> None:
        client = getattr(self, "_client", None)
        if client is not None:
            try:
                client.close()
            except Exception:
                pass

    def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        merged = {"client_id": self._client_id, "format": "json", **params}
        response = self._client.get(path, params=merged)
        response.raise_for_status()
        return response.json()

    def search(
        self,
        q: str,
        *,
        limit: int = 24,
        offset: int = 0,
        kinds: tuple[str, ...] = ("track", "artist", "album"),
    ) -> SearchResultDTO:
        tracks: tuple[TrackDTO, ...] = ()
        artists: tuple[ArtistDTO, ...] = ()
        albums: tuple[AlbumDTO, ...] = ()

        if "track" in kinds:
            data = self._get(
                "/tracks/",
                {"search": q, "limit": limit, "offset": offset, "include": "musicinfo", "audioformat": "mp32"},
            )
            tracks = tuple(self._parse_track(item) for item in data.get("results", []))

        if "artist" in kinds:
            data = self._get("/artists/", {"namesearch": q, "limit": limit, "offset": offset})
            artists = tuple(self._parse_artist(item) for item in data.get("results", []))

        if "album" in kinds:
            data = self._get("/albums/", {"namesearch": q, "limit": limit, "offset": offset})
            albums = tuple(self._parse_album(item) for item in data.get("results", []))

        return SearchResultDTO(tracks=tracks, artists=artists, albums=albums)

    def track(self, source_id: str) -> Optional[TrackDTO]:
        data = self._get("/tracks/", {"id": source_id, "include": "musicinfo", "audioformat": "mp32"})
        results = data.get("results", [])
        if not results:
            return None
        return self._parse_track(results[0])

    def album(self, source_id: str) -> Optional[AlbumDTO]:
        data = self._get("/albums/", {"id": source_id})
        results = data.get("results", [])
        if not results:
            return None
        return self._parse_album(results[0])

    def artist(self, source_id: str) -> Optional[ArtistDTO]:
        data = self._get("/artists/", {"id": source_id})
        results = data.get("results", [])
        if not results:
            return None
        return self._parse_artist(results[0])

    def stream_url(self, source_id: str) -> Optional[str]:
        data = self._get("/tracks/", {"id": source_id, "audioformat": "mp32"})
        results = data.get("results", [])
        if not results:
            return None
        return results[0].get("audio") or results[0].get("audiodownload") or None

    def popular_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        data = self._get(
            "/tracks/",
            {
                "limit": limit,
                "offset": offset,
                "order": "popularity_total",
                "include": "musicinfo",
                "audioformat": "mp32",
            },
        )
        return tuple(self._parse_track(item) for item in data.get("results", []))

    def recent_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        data = self._get(
            "/tracks/",
            {
                "limit": limit,
                "offset": offset,
                "order": "releasedate_desc",
                "include": "musicinfo",
                "audioformat": "mp32",
            },
        )
        return tuple(self._parse_track(item) for item in data.get("results", []))

    def _parse_track(self, item: dict[str, Any]) -> TrackDTO:
        musicinfo = item.get("musicinfo") or {}
        tags = musicinfo.get("tags") or {}
        genres_raw = tags.get("genres") if isinstance(tags, dict) else None
        genres = tuple(g for g in (genres_raw or []) if isinstance(g, str))
        return TrackDTO(
            source=self.source,
            source_id=str(item.get("id", "")),
            title=str(item.get("name", "")),
            artist_source_id=str(item.get("artist_id", "")),
            artist_name=str(item.get("artist_name", "")),
            album_source_id=str(item.get("album_id")) if item.get("album_id") else None,
            album_title=item.get("album_name") or None,
            cover=item.get("album_image") or item.get("image") or None,
            duration_ms=int(float(item.get("duration", 0)) * 1000),
            track_number=int(item["position"]) if item.get("position") else None,
            genres=genres,
            bpm=int(musicinfo["bpm"]) if isinstance(musicinfo, dict) and musicinfo.get("bpm") else None,
            explicit=False,
            preview_url=item.get("audio") or None,
        )

    def _parse_artist(self, item: dict[str, Any]) -> ArtistDTO:
        return ArtistDTO(
            source=self.source,
            source_id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            image=item.get("image") or None,
            country=item.get("joindate") and None,
        )

    def _parse_album(self, item: dict[str, Any]) -> AlbumDTO:
        return AlbumDTO(
            source=self.source,
            source_id=str(item.get("id", "")),
            title=str(item.get("name", "")),
            artist_source_id=str(item.get("artist_id", "")),
            artist_name=str(item.get("artist_name", "")),
            cover=item.get("image") or None,
            release_date=item.get("releasedate") or None,
            total_tracks=None,
            album_type="album",
        )
