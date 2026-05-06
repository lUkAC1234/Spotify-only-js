import logging
from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable, Optional

from django.db import transaction
from django.utils import timezone

from .models import Album, Artist, Genre, Source, Track, TrackGenre
from .providers import (
    AlbumDTO,
    ArtistDTO,
    AudiusProvider,
    JamendoProvider,
    MusicProvider,
    SearchResultDTO,
    TrackDTO,
)

logger = logging.getLogger(__name__)

METADATA_TTL = timedelta(hours=24)
AUDIO_URL_TTL = timedelta(hours=1)


@dataclass(frozen=True)
class SyncedSearch:
    tracks: list[Track]
    artists: list[Artist]
    albums: list[Album]


class CatalogSyncService:
    def __init__(self, providers: Optional[dict[str, MusicProvider]] = None) -> None:
        self._providers = providers

    def get_provider(self, source: str) -> MusicProvider:
        if self._providers and source in self._providers:
            return self._providers[source]
        if source == Source.JAMENDO:
            self._providers = {**(self._providers or {}), source: JamendoProvider()}
            return self._providers[source]
        if source == Source.AUDIUS:
            self._providers = {**(self._providers or {}), source: AudiusProvider()}
            return self._providers[source]
        raise ValueError(f"Unknown source: {source}")

    @transaction.atomic
    def upsert_artist(self, dto: ArtistDTO) -> Artist:
        artist, _ = Artist.objects.update_or_create(
            source=dto.source,
            source_id=dto.source_id,
            defaults={
                "name": dto.name or "Unknown",
                "image": dto.image or "",
                "bio": dto.bio or "",
                "country": dto.country or "",
                "metadata_synced_at": timezone.now(),
            },
        )
        return artist

    @transaction.atomic
    def upsert_album(self, dto: AlbumDTO, artist: Optional[Artist] = None) -> Album:
        if artist is None:
            artist = self._ensure_artist_by_source(dto.source, dto.artist_source_id, dto.artist_name)
        album, _ = Album.objects.update_or_create(
            source=dto.source,
            source_id=dto.source_id,
            defaults={
                "artist": artist,
                "title": dto.title or "Untitled",
                "cover": dto.cover or "",
                "release_date": dto.release_date if self._is_date_string(dto.release_date) else None,
                "total_tracks": dto.total_tracks or 0,
                "type": dto.album_type or "album",
                "metadata_synced_at": timezone.now(),
            },
        )
        return album

    @transaction.atomic
    def upsert_track(self, dto: TrackDTO) -> Track:
        artist = self._ensure_artist_by_source(dto.source, dto.artist_source_id, dto.artist_name)

        album: Optional[Album] = None
        if dto.album_source_id and dto.album_title:
            album, _ = Album.objects.get_or_create(
                source=dto.source,
                source_id=dto.album_source_id,
                defaults={
                    "artist": artist,
                    "title": dto.album_title,
                    "cover": dto.cover or "",
                    "metadata_synced_at": timezone.now(),
                },
            )

        track, _ = Track.objects.update_or_create(
            source=dto.source,
            source_id=dto.source_id,
            defaults={
                "artist": artist,
                "album": album,
                "title": dto.title or "Untitled",
                "duration_ms": dto.duration_ms or 0,
                "track_number": dto.track_number,
                "cover": dto.cover or (album.cover if album else ""),
                "explicit": dto.explicit,
                "bpm": dto.bpm,
                "metadata_synced_at": timezone.now(),
            },
        )

        if dto.genres:
            self._sync_genres(track, dto.genres)

        return track

    def search(
        self,
        query: str,
        *,
        source: str = Source.JAMENDO,
        kinds: tuple[str, ...] = ("track", "artist", "album"),
        limit: int = 24,
        offset: int = 0,
    ) -> SyncedSearch:
        provider = self.get_provider(source)
        result: SearchResultDTO = provider.search(query, limit=limit, offset=offset, kinds=kinds)

        tracks = [self.upsert_track(dto) for dto in result.tracks]
        artists = [self.upsert_artist(dto) for dto in result.artists]
        albums = [self.upsert_album(dto) for dto in result.albums]

        return SyncedSearch(tracks=tracks, artists=artists, albums=albums)

    def popular_tracks(
        self,
        *,
        source: str = Source.JAMENDO,
        limit: int = 12,
        offset: int = 0,
    ) -> list[Track]:
        provider = self.get_provider(source)
        dtos = provider.popular_tracks(limit=limit, offset=offset)
        return [self.upsert_track(dto) for dto in dtos]

    def recent_tracks(
        self,
        *,
        source: str = Source.JAMENDO,
        limit: int = 12,
        offset: int = 0,
    ) -> list[Track]:
        provider = self.get_provider(source)
        dtos = provider.recent_tracks(limit=limit, offset=offset)
        return [self.upsert_track(dto) for dto in dtos]

    def get_or_sync_track(self, track_id: int) -> Optional[Track]:
        track = Track.objects.select_related("artist", "album").filter(pk=track_id).first()
        if not track:
            return None
        if self._is_metadata_fresh(track.metadata_synced_at):
            return track
        provider = self.get_provider(track.source)
        dto = provider.track(track.source_id)
        if not dto:
            return track
        return self.upsert_track(dto)

    def get_or_sync_album(self, album_id: int) -> Optional[Album]:
        album = Album.objects.select_related("artist").filter(pk=album_id).first()
        if not album:
            return None
        if self._is_metadata_fresh(album.metadata_synced_at):
            return album
        provider = self.get_provider(album.source)
        dto = provider.album(album.source_id)
        if not dto:
            return album
        return self.upsert_album(dto, artist=album.artist)

    def get_or_sync_artist(self, artist_id: int) -> Optional[Artist]:
        artist = Artist.objects.filter(pk=artist_id).first()
        if not artist:
            return None
        if self._is_metadata_fresh(artist.metadata_synced_at):
            return artist
        provider = self.get_provider(artist.source)
        dto = provider.artist(artist.source_id)
        if not dto:
            return artist
        return self.upsert_artist(dto)

    def resolve_stream_url(self, track: Track) -> Optional[str]:
        if track.is_unavailable:
            return None
        if (
            track.audio_url_cached
            and track.audio_url_cached_at
            and timezone.now() - track.audio_url_cached_at < AUDIO_URL_TTL
        ):
            return track.audio_url_cached

        provider = self.get_provider(track.source)
        url = provider.stream_url(track.source_id)
        if not url:
            track.is_unavailable = True
            track.save(update_fields=["is_unavailable", "updated_at"])
            return None

        track.audio_url_cached = url
        track.audio_url_cached_at = timezone.now()
        track.save(update_fields=["audio_url_cached", "audio_url_cached_at", "updated_at"])
        return url

    def _ensure_artist_by_source(self, source: str, source_id: str, fallback_name: str) -> Artist:
        if not source_id:
            artist, _ = Artist.objects.get_or_create(
                source=source,
                source_id=f"unknown:{fallback_name}" or "unknown",
                defaults={"name": fallback_name or "Unknown", "metadata_synced_at": timezone.now()},
            )
            return artist
        artist, _ = Artist.objects.get_or_create(
            source=source,
            source_id=source_id,
            defaults={"name": fallback_name or "Unknown", "metadata_synced_at": timezone.now()},
        )
        return artist

    def _sync_genres(self, track: Track, genre_names: Iterable[str]) -> None:
        for raw in genre_names:
            name = (raw or "").strip()
            if not name:
                continue
            genre, _ = Genre.objects.get_or_create(
                name=name[:80],
                defaults={"name": name[:80]},
            )
            TrackGenre.objects.get_or_create(track=track, genre=genre)

    @staticmethod
    def _is_metadata_fresh(synced_at) -> bool:
        if not synced_at:
            return False
        return timezone.now() - synced_at < METADATA_TTL

    @staticmethod
    def _is_date_string(value) -> bool:
        if not value or not isinstance(value, str):
            return False
        return len(value) >= 10 and value[4] == "-" and value[7] == "-"
