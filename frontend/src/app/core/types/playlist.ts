import { Album } from "./album";
import { Artist } from "./artist";
import { Track } from "./track";

export interface PlaylistOwner {
    id: number;
    username: string;
    displayName: string;
    avatar: string | null;
}

export interface PlaylistItem {
    id: number;
    track: Track;
    position: number;
    addedById: number | null;
    addedAt: string;
}

export interface PlaylistCollaboratorEntry {
    id: number;
    user: PlaylistOwner;
    addedAt: string;
}

export interface PlaylistSummary {
    id: number;
    owner: PlaylistOwner;
    title: string;
    slug: string;
    description: string;
    cover: string;
    isPublic: boolean;
    isCollaborative: boolean;
    isSystem: boolean;
    totalTracks: number;
    sortOrder: number;
    updatedAt: string;
}

export interface PlaylistDetail extends PlaylistSummary {
    items: PlaylistItem[];
    collaborators: PlaylistCollaboratorEntry[];
    totalDurationMs: number;
    canEdit: boolean;
}

export interface FeaturedPlaylist {
    id: number;
    title: string;
    slug: string;
    description: string;
    cover: string;
    isSystem: boolean;
    isPublic: boolean;
    isCollaborative: boolean;
    totalTracks: number;
    ownerName: string;
    sortOrder: number;
    updatedAt: string;
}

export interface FeaturedPlaylistDetail extends FeaturedPlaylist {
    tracks: Track[];
    totalDurationMs: number;
}

export interface SavedTrackEntry {
    id: number;
    track: Track;
    savedAt: string;
}

export interface SavedAlbumEntry {
    id: number;
    album: Album;
    savedAt: string;
}

export interface FollowedArtistEntry {
    id: number;
    artist: Artist;
    followedAt: string;
}

export interface HistoryEntry {
    id: number;
    track: Track;
    playedAt: string;
    msListened: number;
    source: string;
}

export interface Genre {
    id: number;
    slug: string;
    name: string;
    trackCount: number;
}
