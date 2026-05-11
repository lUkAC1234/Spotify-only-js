"""Unofficial Yandex Music client. Personal/educational use only.

Violates Yandex Music ToS — do not deploy publicly multi-tenant.

This provider talks to the private Yandex Music API via the community
``yandex-music`` Python library. It is gated behind ``YANDEX_MUSIC_TOKEN``;
absent that env var, instantiation raises ``ImproperlyConfigured`` and the
catalog falls back to Jamendo + Audius.

The ``source`` field on every DTO is ``"yandex"`` and travels unchanged to
the frontend so UI badges can label provenance honestly.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .base import AlbumDTO, ArtistDTO, MusicProvider, SearchResultDTO, TrackDTO

logger = logging.getLogger(__name__)

YANDEX_COVER_SIZE = "400x400"
YANDEX_AVATAR_SIZE = "400x400"
YANDEX_DOWNLOAD_PREFERRED_BITRATE = 192


class YandexMusicProvider(MusicProvider):
    source = "yandex"

    def __init__(self, token: Optional[str] = None) -> None:
        resolved = token or getattr(settings, "YANDEX_MUSIC_TOKEN", "") or ""
        if not resolved:
            raise ImproperlyConfigured("YANDEX_MUSIC_TOKEN is not set")
        try:
            from yandex_music import Client
        except ImportError as exc:
            raise ImproperlyConfigured(
                "yandex-music package is not installed; pip install yandex-music"
            ) from exc
        self._client = Client(resolved).init()

    def search(
        self,
        q: str,
        *,
        limit: int = 24,
        offset: int = 0,
        kinds: tuple[str, ...] = ("track", "artist", "album"),
    ) -> SearchResultDTO:
        page = max(0, offset // max(limit, 1))
        result = self._client.search(q, page=page, type_="all", nocorrect=False)

        tracks: tuple[TrackDTO, ...] = ()
        artists: tuple[ArtistDTO, ...] = ()
        albums: tuple[AlbumDTO, ...] = ()

        if "track" in kinds and result and result.tracks and result.tracks.results:
            tracks = tuple(self._parse_track(item) for item in result.tracks.results[:limit])
        if "artist" in kinds and result and result.artists and result.artists.results:
            artists = tuple(self._parse_artist(item) for item in result.artists.results[:limit])
        if "album" in kinds and result and result.albums and result.albums.results:
            albums = tuple(self._parse_album(item) for item in result.albums.results[:limit])

        return SearchResultDTO(tracks=tracks, artists=artists, albums=albums)

    def track(self, source_id: str) -> Optional[TrackDTO]:
        if not source_id:
            return None
        try:
            results = self._client.tracks([source_id])
        except Exception as exc:
            logger.warning("Yandex track lookup failed for %s: %s", source_id, exc)
            return None
        if not results:
            return None
        return self._parse_track(results[0])

    def album(self, source_id: str) -> Optional[AlbumDTO]:
        if not source_id:
            return None
        try:
            album = self._client.albums_with_tracks(source_id)
        except Exception as exc:
            logger.warning("Yandex album lookup failed for %s: %s", source_id, exc)
            return None
        if not album:
            return None
        return self._parse_album(album)

    def artist(self, source_id: str) -> Optional[ArtistDTO]:
        if not source_id:
            return None
        try:
            results = self._client.artists([source_id])
        except Exception as exc:
            logger.warning("Yandex artist lookup failed for %s: %s", source_id, exc)
            return None
        if not results:
            return None
        return self._parse_artist(results[0])

    def stream_url(self, source_id: str) -> Optional[str]:
        if not source_id:
            return None
        track_id = self._strip_album_suffix(source_id)
        try:
            download_info = self._client.tracks_download_info(track_id, get_direct_links=False)
        except Exception as exc:
            logger.warning("Yandex download_info failed for %s: %s", source_id, exc)
            return None
        if not download_info:
            return None
        chosen = self._pick_download(download_info)
        if not chosen:
            return None
        try:
            return chosen.get_direct_link()
        except Exception as exc:
            logger.warning("Yandex direct_link failed for %s: %s", source_id, exc)
            return None

    def popular_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        try:
            chart = self._client.chart()
        except Exception as exc:
            logger.warning("Yandex chart failed: %s", exc)
            return ()
        items = self._extract_chart_tracks(chart)
        sliced = items[offset : offset + limit] if items else []
        return tuple(self._parse_track(item) for item in sliced)

    def recent_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        try:
            new_releases = self._client.new_releases()
        except Exception as exc:
            logger.warning("Yandex new_releases failed: %s", exc)
            return ()
        ids = self._extract_new_release_ids(new_releases)
        if not ids:
            return ()
        try:
            albums = self._client.albums(ids[: max(limit + offset, limit)])
        except Exception as exc:
            logger.warning("Yandex albums batch failed: %s", exc)
            return ()
        tracks: list[TrackDTO] = []
        for album in albums or []:
            cover = self._album_cover(album)
            artist_name = self._album_artist_name(album)
            artist_id = self._album_artist_id(album)
            for volume in getattr(album, "volumes", None) or []:
                for item in volume or []:
                    tracks.append(self._parse_track(item, fallback_cover=cover, fallback_artist_id=artist_id, fallback_artist_name=artist_name))
                    if len(tracks) >= limit + offset:
                        break
                if len(tracks) >= limit + offset:
                    break
            if len(tracks) >= limit + offset:
                break
        return tuple(tracks[offset : offset + limit])

    def tracks_by_tag(self, tag: str, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        if not tag:
            return ()
        try:
            landing = self._client.tags(tag)
        except Exception as exc:
            logger.warning("Yandex tag lookup failed for %s: %s", tag, exc)
            return ()
        ids = self._extract_tag_album_ids(landing)
        if not ids:
            return ()
        try:
            albums = self._client.albums(ids[: max(limit + offset, limit)])
        except Exception as exc:
            logger.warning("Yandex tag albums failed for %s: %s", tag, exc)
            return ()
        tracks: list[TrackDTO] = []
        for album in albums or []:
            cover = self._album_cover(album)
            artist_name = self._album_artist_name(album)
            artist_id = self._album_artist_id(album)
            for volume in getattr(album, "volumes", None) or []:
                for item in volume or []:
                    tracks.append(self._parse_track(item, fallback_cover=cover, fallback_artist_id=artist_id, fallback_artist_name=artist_name))
                    if len(tracks) >= limit + offset:
                        break
                if len(tracks) >= limit + offset:
                    break
            if len(tracks) >= limit + offset:
                break
        return tuple(tracks[offset : offset + limit])

    def _parse_track(
        self,
        item: Any,
        *,
        fallback_cover: Optional[str] = None,
        fallback_artist_id: Optional[str] = None,
        fallback_artist_name: Optional[str] = None,
    ) -> TrackDTO:
        track = getattr(item, "track", None) or item
        track_id = self._format_track_id(track)
        artists = getattr(track, "artists", None) or []
        primary_artist = artists[0] if artists else None
        albums = getattr(track, "albums", None) or []
        primary_album = albums[0] if albums else None

        artist_id = self._coerce_id(getattr(primary_artist, "id", None)) or fallback_artist_id or ""
        artist_name = (getattr(primary_artist, "name", None) if primary_artist else None) or fallback_artist_name or ""

        album_id = self._coerce_id(getattr(primary_album, "id", None)) if primary_album else None
        album_title = getattr(primary_album, "title", None) if primary_album else None
        track_position = getattr(primary_album, "track_position", None)
        track_number = getattr(track_position, "index", None) if track_position else None

        cover = self._format_cover(getattr(track, "cover_uri", None)) or fallback_cover or ""
        genres = ()
        meta_type = getattr(track, "meta_type", None)
        if meta_type:
            genres = (str(meta_type),)

        duration_ms = int(getattr(track, "duration_ms", 0) or 0)

        return TrackDTO(
            source=self.source,
            source_id=track_id,
            title=str(getattr(track, "title", "") or ""),
            artist_source_id=str(artist_id or ""),
            artist_name=str(artist_name or ""),
            album_source_id=str(album_id) if album_id else None,
            album_title=str(album_title) if album_title else None,
            cover=cover or None,
            duration_ms=duration_ms,
            track_number=int(track_number) if track_number else None,
            genres=genres,
            bpm=None,
            explicit=bool(getattr(track, "content_warning", None)),
            preview_url=None,
        )

    def _parse_artist(self, item: Any) -> ArtistDTO:
        cover = getattr(item, "cover", None)
        ogimage = getattr(item, "op_image", None) or getattr(item, "og_image", None)
        image = self._format_cover(getattr(cover, "uri", None)) if cover else self._format_cover(ogimage)
        description = getattr(item, "description", None)
        bio = getattr(description, "text", None) if description else None
        countries = getattr(item, "countries", None) or []
        return ArtistDTO(
            source=self.source,
            source_id=self._coerce_id(getattr(item, "id", "")) or "",
            name=str(getattr(item, "name", "") or ""),
            image=image or None,
            bio=str(bio) if bio else None,
            country=str(countries[0]) if countries else None,
        )

    def _parse_album(self, item: Any) -> AlbumDTO:
        artist_name = self._album_artist_name(item)
        artist_id = self._album_artist_id(item)
        return AlbumDTO(
            source=self.source,
            source_id=self._coerce_id(getattr(item, "id", "")) or "",
            title=str(getattr(item, "title", "") or ""),
            artist_source_id=str(artist_id or ""),
            artist_name=str(artist_name or ""),
            cover=self._album_cover(item) or None,
            release_date=self._album_release_date(item),
            total_tracks=int(getattr(item, "track_count", 0) or 0) or None,
            album_type=str(getattr(item, "type", "album") or "album"),
        )

    @staticmethod
    def _format_track_id(track: Any) -> str:
        track_id = getattr(track, "id", None) or getattr(track, "track_id", None) or ""
        return str(track_id) if track_id else ""

    @staticmethod
    def _strip_album_suffix(source_id: str) -> str:
        if ":" in source_id:
            return source_id.split(":", 1)[0]
        return source_id

    @staticmethod
    def _coerce_id(value: Any) -> Optional[str]:
        if value is None:
            return None
        return str(value)

    @staticmethod
    def _format_cover(uri: Optional[str]) -> Optional[str]:
        if not uri:
            return None
        if uri.startswith("http"):
            return uri
        cleaned = uri.replace("%%", "")
        if cleaned.endswith("/"):
            return f"https://{cleaned}{YANDEX_COVER_SIZE}"
        return f"https://{cleaned}/{YANDEX_COVER_SIZE}".replace("///", "//")

    @classmethod
    def _album_cover(cls, album: Any) -> Optional[str]:
        return cls._format_cover(getattr(album, "cover_uri", None) or getattr(album, "og_image", None))

    @staticmethod
    def _album_artist_name(album: Any) -> str:
        artists = getattr(album, "artists", None) or []
        if artists:
            return str(getattr(artists[0], "name", "") or "")
        return ""

    @classmethod
    def _album_artist_id(cls, album: Any) -> str:
        artists = getattr(album, "artists", None) or []
        if artists:
            return cls._coerce_id(getattr(artists[0], "id", None)) or ""
        return ""

    @staticmethod
    def _album_release_date(album: Any) -> Optional[str]:
        release_date = getattr(album, "release_date", None)
        if release_date:
            return str(release_date)[:10]
        year = getattr(album, "year", None)
        return f"{int(year):04d}-01-01" if year else None

    @staticmethod
    def _pick_download(download_info: list[Any]) -> Optional[Any]:
        mp3 = [info for info in download_info if (getattr(info, "codec", "") or "").lower() == "mp3"]
        candidates = mp3 or list(download_info)
        if not candidates:
            return None
        candidates.sort(key=lambda info: (
            abs(int(getattr(info, "bitrate_in_kbps", 0) or 0) - YANDEX_DOWNLOAD_PREFERRED_BITRATE),
            -int(getattr(info, "bitrate_in_kbps", 0) or 0),
        ))
        return candidates[0]

    @staticmethod
    def _extract_chart_tracks(chart: Any) -> list[Any]:
        if not chart:
            return []
        chart_object = getattr(chart, "chart", None) or chart
        tracks = getattr(chart_object, "tracks", None) or []
        return list(tracks)

    @staticmethod
    def _extract_new_release_ids(new_releases: Any) -> list[str]:
        if not new_releases:
            return []
        ids = getattr(new_releases, "new_releases", None) or getattr(new_releases, "ids", None) or []
        return [str(item) for item in ids if item is not None]

    @staticmethod
    def _extract_tag_album_ids(landing: Any) -> list[str]:
        if not landing:
            return []
        ids: list[str] = []
        for attr in ("ids", "albums", "album_ids"):
            value = getattr(landing, attr, None) or []
            for entry in value:
                if hasattr(entry, "id"):
                    ids.append(str(entry.id))
                else:
                    ids.append(str(entry))
        return ids
