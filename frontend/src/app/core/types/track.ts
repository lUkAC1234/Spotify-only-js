import { Album } from "./album";
import { Artist } from "./artist";

export interface Track {
    id: number;
    source: string;
    sourceId: string;
    title: string;
    slug: string;
    artist: Artist;
    album: Album | null;
    cover: string | null;
    durationMs: number;
    trackNumber: number | null;
    explicit: boolean;
    bpm: number | null;
    genres: string[];
}

export type PlaybackContextType = "track" | "album" | "playlist" | "artist" | "search" | "queue" | "radio";

export interface PlaybackContext {
    type: PlaybackContextType;
    id: string | number | null;
}
