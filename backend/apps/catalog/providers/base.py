from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import ClassVar, Optional


@dataclass(frozen=True)
class ArtistDTO:
    source: str
    source_id: str
    name: str
    image: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None


@dataclass(frozen=True)
class AlbumDTO:
    source: str
    source_id: str
    title: str
    artist_source_id: str
    artist_name: str
    cover: Optional[str] = None
    release_date: Optional[str] = None
    total_tracks: Optional[int] = None
    album_type: str = "album"


@dataclass(frozen=True)
class TrackDTO:
    source: str
    source_id: str
    title: str
    artist_source_id: str
    artist_name: str
    album_source_id: Optional[str] = None
    album_title: Optional[str] = None
    cover: Optional[str] = None
    duration_ms: int = 0
    track_number: Optional[int] = None
    genres: tuple[str, ...] = field(default_factory=tuple)
    bpm: Optional[int] = None
    explicit: bool = False
    preview_url: Optional[str] = None


@dataclass(frozen=True)
class SearchResultDTO:
    tracks: tuple[TrackDTO, ...] = field(default_factory=tuple)
    artists: tuple[ArtistDTO, ...] = field(default_factory=tuple)
    albums: tuple[AlbumDTO, ...] = field(default_factory=tuple)


class MusicProvider(ABC):
    source: ClassVar[str] = ""

    @abstractmethod
    def search(
        self,
        q: str,
        *,
        limit: int = 24,
        offset: int = 0,
        kinds: tuple[str, ...] = ("track", "artist", "album"),
    ) -> SearchResultDTO: ...

    @abstractmethod
    def track(self, source_id: str) -> Optional[TrackDTO]: ...

    @abstractmethod
    def album(self, source_id: str) -> Optional[AlbumDTO]: ...

    @abstractmethod
    def artist(self, source_id: str) -> Optional[ArtistDTO]: ...

    @abstractmethod
    def stream_url(self, source_id: str) -> Optional[str]: ...

    def popular_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        return ()

    def recent_tracks(self, *, limit: int = 12, offset: int = 0) -> tuple[TrackDTO, ...]:
        return ()
