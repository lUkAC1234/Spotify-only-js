from typing import Any, Optional

import httpx
from django.conf import settings

from .base import AlbumDTO, ArtistDTO, MusicProvider, SearchResultDTO, TrackDTO

AUDIUS_DEFAULT_HOST = "https://discoveryprovider.audius.co"
AUDIUS_DEFAULT_TIMEOUT = 10.0
AUDIUS_APP_NAME = "spotify-clone"


class AudiusProvider(MusicProvider):
    source = "audius"

    def __init__(self, host: Optional[str] = None, *, timeout: float = AUDIUS_DEFAULT_TIMEOUT) -> None:
        resolved = host or getattr(settings, "AUDIUS_DISCOVERY_HOST", "") or AUDIUS_DEFAULT_HOST
        self._client = httpx.Client(base_url=resolved.rstrip("/"), timeout=timeout)

    def __del__(self) -> None:
        client = getattr(self, "_client", None)
        if client is not None:
            try:
                client.close()
            except Exception:
                pass

    def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        merged = {"app_name": AUDIUS_APP_NAME, **params}
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

        if "track" in kinds:
            data = self._get("/v1/tracks/search", {"query": q, "limit": limit, "offset": offset})
            tracks = tuple(self._parse_track(item) for item in data.get("data", []) or [])

        if "artist" in kinds:
            data = self._get("/v1/users/search", {"query": q, "limit": limit, "offset": offset})
            artists = tuple(self._parse_artist(item) for item in data.get("data", []) or [])

        return SearchResultDTO(tracks=tracks, artists=artists, albums=())

    def track(self, source_id: str) -> Optional[TrackDTO]:
        data = self._get(f"/v1/tracks/{source_id}", {})
        item = data.get("data")
        if not item:
            return None
        return self._parse_track(item)

    def album(self, source_id: str) -> Optional[AlbumDTO]:
        raise NotImplementedError("Audius albums land in Phase 2")

    def artist(self, source_id: str) -> Optional[ArtistDTO]:
        data = self._get(f"/v1/users/{source_id}", {})
        item = data.get("data")
        if not item:
            return None
        return self._parse_artist(item)

    def stream_url(self, source_id: str) -> Optional[str]:
        return f"{self._client.base_url}/v1/tracks/{source_id}/stream?app_name={AUDIUS_APP_NAME}"

    def _parse_track(self, item: dict[str, Any]) -> TrackDTO:
        user = item.get("user") or {}
        artwork = item.get("artwork") or {}
        cover = artwork.get("480x480") or artwork.get("150x150") or artwork.get("1000x1000") or None
        return TrackDTO(
            source=self.source,
            source_id=str(item.get("id", "")),
            title=str(item.get("title", "")),
            artist_source_id=str(user.get("id", "")),
            artist_name=str(user.get("name", "")),
            album_source_id=None,
            album_title=None,
            cover=cover,
            duration_ms=int(item.get("duration", 0)) * 1000,
            genres=(item["genre"],) if item.get("genre") else (),
            preview_url=None,
        )

    def _parse_artist(self, item: dict[str, Any]) -> ArtistDTO:
        photo = item.get("profile_picture") or {}
        image = photo.get("480x480") or photo.get("150x150") or None
        return ArtistDTO(
            source=self.source,
            source_id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            image=image,
            bio=item.get("bio") or None,
            country=item.get("location") or None,
        )
