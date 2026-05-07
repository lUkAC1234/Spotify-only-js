import { Artist } from "./artist";
import { Track } from "./track";

export type AlbumType = "album" | "single" | "ep" | "compilation";

export interface Album {
    id: number;
    source: string;
    sourceId: string;
    title: string;
    slug: string;
    artist: Artist;
    cover: string | null;
    releaseDate: string | null;
    totalTracks: number;
    type: AlbumType;
}

export interface AlbumDetail extends Album {
    tracks: Track[];
    totalDurationMs: number;
    year: number | null;
    relatedAlbums: Album[];
}
