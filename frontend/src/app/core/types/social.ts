import { Track } from "./track";
import { PublicUser } from "./user";

export interface FriendListening {
    user: PublicUser;
    track: Track;
    isPlaying: boolean;
    positionMs: number;
    updatedAt: string;
}

export interface FeedEntry {
    id: number;
    user: PublicUser;
    track: Track;
    playedAt: string;
    source: string;
}

export interface FollowEntry {
    id: number;
    user: PublicUser;
    followedAt: string;
}

export interface RecapTrack {
    id: number;
    title: string;
    artistName: string;
    cover: string;
    plays: number;
}

export interface RecapArtist {
    id: number;
    name: string;
    image: string;
    plays: number;
}

export interface RecapGenre {
    id: number;
    slug: string;
    name: string;
    plays: number;
}

export interface YearlyRecap {
    year: number;
    topTracks: RecapTrack[];
    topArtists: RecapArtist[];
    topGenres: RecapGenre[];
    totalPlays: number;
}
