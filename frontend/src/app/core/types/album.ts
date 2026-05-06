import { Artist } from "./artist";

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
