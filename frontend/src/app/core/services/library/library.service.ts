import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import {
    FollowedArtistEntry,
    HistoryEntry,
    PlaylistDetail,
    PlaylistSummary,
    SavedAlbumEntry,
    SavedTrackEntry,
} from "@/app/core/types/playlist";
import { inject, injectable } from "@/app/shared/decorators/di";
import { Log } from "@/app/shared/utils/functions/logger";

import { apiRequest } from "../http/api-client";

@injectable()
export class LibraryService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly disposable: DisposableService = inject(DisposableService);

    @observable savedTrackIds: Set<number> = new Set();
    @observable savedAlbumIds: Set<number> = new Set();
    @observable followedArtistIds: Set<number> = new Set();
    @observable myPlaylists: PlaylistSummary[] = [];
    @observable savedTracks: SavedTrackEntry[] = [];
    @observable savedAlbums: SavedAlbumEntry[] = [];
    @observable followedArtists: FollowedArtistEntry[] = [];
    @observable isLoadingPlaylists: boolean = false;
    @observable isLoadingLibrary: boolean = false;

    private isMounted: boolean = false;

    constructor() {
        makeObservable(this);
    }

    init(): void {
        if (this.isMounted) return;
        this.isMounted = true;
        this.disposable.register(
            "library-on-auth",
            reaction(
                () => this.auth.isAuthenticated,
                (authed) => {
                    if (authed) {
                        void this.refreshAll();
                    } else {
                        runInAction(() => {
                            this.savedTrackIds = new Set();
                            this.savedAlbumIds = new Set();
                            this.followedArtistIds = new Set();
                            this.myPlaylists = [];
                            this.savedTracks = [];
                            this.savedAlbums = [];
                            this.followedArtists = [];
                        });
                    }
                },
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
        this.isMounted = false;
    }

    @computed
    get likedTotal(): number {
        return this.savedTracks.length || this.savedTrackIds.size;
    }

    isTrackSaved(trackId: number): boolean {
        return this.savedTrackIds.has(trackId);
    }

    isAlbumSaved(albumId: number): boolean {
        return this.savedAlbumIds.has(albumId);
    }

    isArtistFollowed(artistId: number): boolean {
        return this.followedArtistIds.has(artistId);
    }

    async refreshAll(): Promise<void> {
        await Promise.all([
            this.fetchSavedTrackIds(),
            this.fetchSavedAlbumIds(),
            this.fetchFollowedArtistIds(),
            this.fetchMyPlaylists(),
        ]);
    }

    async fetchSavedTrackIds(): Promise<void> {
        const result = await apiRequest<{ trackIds: number[] }>("GET", "/library/tracks/ids/");
        if (!result.ok || !result.data) return;
        runInAction(() => {
            this.savedTrackIds = new Set(result.data?.trackIds ?? []);
        });
    }

    async fetchSavedAlbumIds(): Promise<void> {
        const result = await apiRequest<{ albumIds: number[] }>("GET", "/library/albums/ids/");
        if (!result.ok || !result.data) return;
        runInAction(() => {
            this.savedAlbumIds = new Set(result.data?.albumIds ?? []);
        });
    }

    async fetchFollowedArtistIds(): Promise<void> {
        const result = await apiRequest<{ artistIds: number[] }>("GET", "/library/artists/ids/");
        if (!result.ok || !result.data) return;
        runInAction(() => {
            this.followedArtistIds = new Set(result.data?.artistIds ?? []);
        });
    }

    async fetchSavedTracks(limit: number = 50): Promise<SavedTrackEntry[]> {
        runInAction(() => {
            this.isLoadingLibrary = true;
        });
        const result = await apiRequest<{ items: SavedTrackEntry[]; total: number }>(
            "GET",
            "/library/tracks/",
            { params: { limit } },
        );
        const items = result.ok && result.data ? result.data.items : [];
        runInAction(() => {
            this.savedTracks = items;
            this.savedTrackIds = new Set(items.map((entry) => entry.track.id));
            this.isLoadingLibrary = false;
        });
        return items;
    }

    async fetchSavedAlbums(limit: number = 50): Promise<SavedAlbumEntry[]> {
        const result = await apiRequest<{ items: SavedAlbumEntry[]; total: number }>(
            "GET",
            "/library/albums/",
            { params: { limit } },
        );
        const items = result.ok && result.data ? result.data.items : [];
        runInAction(() => {
            this.savedAlbums = items;
            this.savedAlbumIds = new Set(items.map((entry) => entry.album.id));
        });
        return items;
    }

    async fetchFollowedArtists(limit: number = 50): Promise<FollowedArtistEntry[]> {
        const result = await apiRequest<{ items: FollowedArtistEntry[]; total: number }>(
            "GET",
            "/library/artists/",
            { params: { limit } },
        );
        const items = result.ok && result.data ? result.data.items : [];
        runInAction(() => {
            this.followedArtists = items;
            this.followedArtistIds = new Set(items.map((entry) => entry.artist.id));
        });
        return items;
    }

    async fetchHistory(limit: number = 50, before?: number): Promise<{ items: HistoryEntry[]; nextBefore: number | null }> {
        const params: Record<string, string | number> = { limit };
        if (before !== undefined) params.before = before;
        const result = await apiRequest<{ items: HistoryEntry[]; nextBefore: number | null }>(
            "GET",
            "/library/history/",
            { params },
        );
        if (!result.ok || !result.data) return { items: [], nextBefore: null };
        return result.data;
    }

    async fetchMyPlaylists(): Promise<PlaylistSummary[]> {
        if (!this.auth.isAuthenticated) {
            runInAction(() => {
                this.myPlaylists = [];
            });
            return [];
        }
        runInAction(() => {
            this.isLoadingPlaylists = true;
        });
        const result = await apiRequest<{ items: PlaylistSummary[] }>("GET", "/playlists/me/");
        const items = result.ok && result.data ? result.data.items : [];
        runInAction(() => {
            this.myPlaylists = items;
            this.isLoadingPlaylists = false;
        });
        return items;
    }

    @action.bound
    private upsertSavedTrack(trackId: number, saved: boolean): void {
        const next = new Set(this.savedTrackIds);
        if (saved) next.add(trackId);
        else next.delete(trackId);
        this.savedTrackIds = next;
    }

    async toggleTrackSaved(trackId: number): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const wasSaved = this.savedTrackIds.has(trackId);
        this.upsertSavedTrack(trackId, !wasSaved);
        const method = wasSaved ? "DELETE" : "PUT";
        const result = await apiRequest<{ saved: boolean }>(method, `/library/tracks/${trackId}/`);
        if (!result.ok) {
            this.upsertSavedTrack(trackId, wasSaved);
            Log.APIError(`[library] toggle track failed: ${result.error?.message ?? "unknown"}`);
            return wasSaved;
        }
        const nowSaved = result.data?.saved ?? !wasSaved;
        this.upsertSavedTrack(trackId, nowSaved);
        return nowSaved;
    }

    async toggleAlbumSaved(albumId: number): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const wasSaved = this.savedAlbumIds.has(albumId);
        runInAction(() => {
            const next = new Set(this.savedAlbumIds);
            if (wasSaved) next.delete(albumId);
            else next.add(albumId);
            this.savedAlbumIds = next;
        });
        const method = wasSaved ? "DELETE" : "PUT";
        const result = await apiRequest<{ saved: boolean }>(method, `/library/albums/${albumId}/`);
        if (!result.ok) {
            runInAction(() => {
                const next = new Set(this.savedAlbumIds);
                if (wasSaved) next.add(albumId);
                else next.delete(albumId);
                this.savedAlbumIds = next;
            });
            return wasSaved;
        }
        return result.data?.saved ?? !wasSaved;
    }

    async toggleArtistFollowed(artistId: number): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const wasFollowing = this.followedArtistIds.has(artistId);
        runInAction(() => {
            const next = new Set(this.followedArtistIds);
            if (wasFollowing) next.delete(artistId);
            else next.add(artistId);
            this.followedArtistIds = next;
        });
        const method = wasFollowing ? "DELETE" : "PUT";
        const result = await apiRequest<{ following: boolean }>(method, `/library/artists/${artistId}/`);
        if (!result.ok) {
            runInAction(() => {
                const next = new Set(this.followedArtistIds);
                if (wasFollowing) next.add(artistId);
                else next.delete(artistId);
                this.followedArtistIds = next;
            });
            return wasFollowing;
        }
        return result.data?.following ?? !wasFollowing;
    }

    async createPlaylist(title: string, description: string = ""): Promise<PlaylistDetail | null> {
        const result = await apiRequest<PlaylistDetail>("POST", "/playlists/", {
            body: { title, description, isPublic: true },
        });
        if (!result.ok || !result.data) return null;
        await this.fetchMyPlaylists();
        return result.data;
    }

    async updatePlaylist(
        id: number,
        patch: { title?: string; description?: string; isPublic?: boolean; isCollaborative?: boolean },
    ): Promise<PlaylistDetail | null> {
        const result = await apiRequest<PlaylistDetail>("PATCH", `/playlists/${id}/`, { body: patch });
        if (!result.ok || !result.data) return null;
        await this.fetchMyPlaylists();
        return result.data;
    }

    async deletePlaylist(id: number): Promise<boolean> {
        const result = await apiRequest("DELETE", `/playlists/${id}/`);
        if (!result.ok) return false;
        runInAction(() => {
            this.myPlaylists = this.myPlaylists.filter((p) => p.id !== id);
        });
        return true;
    }

    async uploadPlaylistCover(id: number, file: File): Promise<PlaylistDetail | null> {
        const form = new FormData();
        form.append("cover", file);
        const result = await apiRequest<PlaylistDetail>("POST", `/playlists/${id}/cover/`, { body: form });
        if (!result.ok || !result.data) return null;
        await this.fetchMyPlaylists();
        return result.data;
    }

    async removePlaylistCover(id: number): Promise<PlaylistDetail | null> {
        const result = await apiRequest<PlaylistDetail>("DELETE", `/playlists/${id}/cover/`);
        if (!result.ok) return null;
        await this.fetchMyPlaylists();
        return result.data;
    }

    async addTracksToPlaylist(playlistId: number, trackIds: number[]): Promise<boolean> {
        const result = await apiRequest("POST", `/playlists/${playlistId}/items/`, {
            body: { trackIds },
        });
        if (result.ok) {
            await this.fetchMyPlaylists();
        }
        return result.ok;
    }

    async movePlaylistItem(playlistId: number, itemId: number, position: number): Promise<boolean> {
        const result = await apiRequest("PATCH", `/playlists/${playlistId}/items/${itemId}/`, {
            body: { position },
        });
        return result.ok;
    }

    async removePlaylistItem(playlistId: number, itemId: number): Promise<boolean> {
        const result = await apiRequest("DELETE", `/playlists/${playlistId}/items/${itemId}/`);
        if (result.ok) {
            await this.fetchMyPlaylists();
        }
        return result.ok;
    }
}
