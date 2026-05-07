import { Album } from "./album";
import { Track } from "./track";

export interface Artist {
    id: number;
    source: string;
    sourceId: string;
    name: string;
    slug: string;
    image: string | null;
    bio: string | null;
    country: string | null;
    monthlyListeners: number;
}

export interface ArtistDetail extends Artist {
    topTracks: Track[];
    albums: Album[];
    relatedArtists: Artist[];
    totalTracks: number;
}
