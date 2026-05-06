import { Track } from "./track";
import { User } from "./user";

export interface PlaylistItem {
    id: number;
    track: Track;
    position: number;
    addedById: number;
    addedAt: string;
}

export interface Playlist {
    id: number;
    owner: Pick<User, "id" | "username" | "displayName" | "avatar">;
    title: string;
    description: string;
    cover: string | null;
    isPublic: boolean;
    isCollaborative: boolean;
    totalTracks: number;
    totalDurationMs: number;
    createdAt: string;
    updatedAt: string;
    items?: PlaylistItem[];
}
