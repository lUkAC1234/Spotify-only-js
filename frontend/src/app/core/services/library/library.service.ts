import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { Album } from "@/app/core/types/album";
import { Artist } from "@/app/core/types/artist";
import {
    FollowedArtistEntry,
    HistoryEntry,
    PlaylistDetail,
    PlaylistSummary,
    SavedAlbumEntry,
    SavedTrackEntry,
} from "@/app/core/types/playlist";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";
import { ActionGuard } from "@/app/shared/utils/classes/ActionGuard";
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
    private readonly guard: ActionGuard = new ActionGuard();
    private savedTracksFetchedAt: number = 0;
    private savedTracksLimit: number = 0;
    private savedTracksPromise: Promise<SavedTrackEntry[]> | null = null;
    private savedAlbumsFetchedAt: number = 0;
    private savedAlbumsLimit: number = 0;
    private savedAlbumsPromise: Promise<SavedAlbumEntry[]> | null = null;
    private followedArtistsFetchedAt: number = 0;
    private followedArtistsLimit: number = 0;
    private followedArtistsPromise: Promise<FollowedArtistEntry[]> | null = null;
    private myPlaylistsFetchedAt: number = 0;
    private myPlaylistsPromise: Promise<PlaylistSummary[]> | null = null;

    private static readonly FRESH_TTL_MS = 30_000;

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
                        this.resetCacheTimestamps();
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

    private resetCacheTimestamps(): void {
        this.savedTracksFetchedAt = 0;
        this.savedTracksLimit = 0;
        this.savedAlbumsFetchedAt = 0;
        this.savedAlbumsLimit = 0;
        this.followedArtistsFetchedAt = 0;
        this.followedArtistsLimit = 0;
        this.myPlaylistsFetchedAt = 0;
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

    isTrackBusy(trackId: number): boolean {
        return this.guard.isBusy(`library:track:${trackId}`);
    }

    isAlbumBusy(albumId: number): boolean {
        return this.guard.isBusy(`library:album:${albumId}`);
    }

    isArtistBusy(artistId: number): boolean {
        return this.guard.isBusy(`library:artist:${artistId}`);
    }

    isPlaylistBusy(playlistId: number): boolean {
        return (
            this.guard.isBusy(`library:playlist:update:${playlistId}`)
            || this.guard.isBusy(`library:playlist:delete:${playlistId}`)
            || this.guard.isBusy(`library:playlist:cover-upload:${playlistId}`)
            || this.guard.isBusy(`library:playlist:cover-remove:${playlistId}`)
            || this.guard.isBusy(`library:playlist:add-tracks:${playlistId}`)
        );
    }

    get isCreatingPlaylist(): boolean {
        return this.guard.isBusy("library:playlist:create");
    }

    async refreshAll(): Promise<void> {
        this.resetCacheTimestamps();
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
        if (this.savedTracksPromise) return this.savedTracksPromise;
        const fresh = Date.now() - this.savedTracksFetchedAt < LibraryService.FRESH_TTL_MS;
        if (fresh && this.savedTracksLimit >= limit) return this.savedTracks;
        runInAction(() => {
            this.isLoadingLibrary = true;
        });
        this.savedTracksPromise = (async () => {
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
                this.savedTracksFetchedAt = Date.now();
                this.savedTracksLimit = limit;
            });
            return items;
        })();
        try {
            return await this.savedTracksPromise;
        } finally {
            this.savedTracksPromise = null;
        }
    }

    async fetchSavedAlbums(limit: number = 50): Promise<SavedAlbumEntry[]> {
        if (this.savedAlbumsPromise) return this.savedAlbumsPromise;
        const fresh = Date.now() - this.savedAlbumsFetchedAt < LibraryService.FRESH_TTL_MS;
        if (fresh && this.savedAlbumsLimit >= limit) return this.savedAlbums;
        this.savedAlbumsPromise = (async () => {
            const result = await apiRequest<{ items: SavedAlbumEntry[]; total: number }>(
                "GET",
                "/library/albums/",
                { params: { limit } },
            );
            const items = result.ok && result.data ? result.data.items : [];
            runInAction(() => {
                this.savedAlbums = items;
                this.savedAlbumIds = new Set(items.map((entry) => entry.album.id));
                this.savedAlbumsFetchedAt = Date.now();
                this.savedAlbumsLimit = limit;
            });
            return items;
        })();
        try {
            return await this.savedAlbumsPromise;
        } finally {
            this.savedAlbumsPromise = null;
        }
    }

    async fetchFollowedArtists(limit: number = 50): Promise<FollowedArtistEntry[]> {
        if (this.followedArtistsPromise) return this.followedArtistsPromise;
        const fresh = Date.now() - this.followedArtistsFetchedAt < LibraryService.FRESH_TTL_MS;
        if (fresh && this.followedArtistsLimit >= limit) return this.followedArtists;
        this.followedArtistsPromise = (async () => {
            const result = await apiRequest<{ items: FollowedArtistEntry[]; total: number }>(
                "GET",
                "/library/artists/",
                { params: { limit } },
            );
            const items = result.ok && result.data ? result.data.items : [];
            runInAction(() => {
                this.followedArtists = items;
                this.followedArtistIds = new Set(items.map((entry) => entry.artist.id));
                this.followedArtistsFetchedAt = Date.now();
                this.followedArtistsLimit = limit;
            });
            return items;
        })();
        try {
            return await this.followedArtistsPromise;
        } finally {
            this.followedArtistsPromise = null;
        }
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
        if (this.myPlaylistsPromise) return this.myPlaylistsPromise;
        if (Date.now() - this.myPlaylistsFetchedAt < LibraryService.FRESH_TTL_MS) {
            return this.myPlaylists;
        }
        runInAction(() => {
            this.isLoadingPlaylists = true;
        });
        this.myPlaylistsPromise = (async () => {
            const result = await apiRequest<{ items: PlaylistSummary[] }>("GET", "/playlists/me/");
            const items = result.ok && result.data ? result.data.items : [];
            runInAction(() => {
                this.myPlaylists = items;
                this.isLoadingPlaylists = false;
                this.myPlaylistsFetchedAt = Date.now();
            });
            return items;
        })();
        try {
            return await this.myPlaylistsPromise;
        } finally {
            this.myPlaylistsPromise = null;
        }
    }

    @action.bound
    private applyTrackToggle(trackId: number, saved: boolean, track?: Track): void {
        const ids = new Set(this.savedTrackIds);
        if (saved) ids.add(trackId);
        else ids.delete(trackId);
        this.savedTrackIds = ids;

        if (saved) {
            if (track && !this.savedTracks.some((entry) => entry.track.id === trackId)) {
                const entry: SavedTrackEntry = {
                    id: -trackId,
                    track,
                    savedAt: new Date().toISOString(),
                };
                this.savedTracks = [entry, ...this.savedTracks];
            }
        } else {
            this.savedTracks = this.savedTracks.filter((entry) => entry.track.id !== trackId);
        }
    }

    @action.bound
    reorderSavedTrack(trackId: number, toIndex: number): void {
        const fromIndex = this.savedTracks.findIndex((entry) => entry.track.id === trackId);
        if (fromIndex < 0 || fromIndex === toIndex) return;
        const next = [...this.savedTracks];
        const [moved] = next.splice(fromIndex, 1);
        const insertAt = Math.max(0, Math.min(toIndex, next.length));
        next.splice(insertAt, 0, moved);
        this.savedTracks = next;
    }

    @action.bound
    private applyAlbumToggle(albumId: number, saved: boolean, album?: Album): void {
        const ids = new Set(this.savedAlbumIds);
        if (saved) ids.add(albumId);
        else ids.delete(albumId);
        this.savedAlbumIds = ids;

        if (saved) {
            if (album && !this.savedAlbums.some((entry) => entry.album.id === albumId)) {
                const entry: SavedAlbumEntry = {
                    id: -albumId,
                    album,
                    savedAt: new Date().toISOString(),
                };
                this.savedAlbums = [entry, ...this.savedAlbums];
            }
        } else {
            this.savedAlbums = this.savedAlbums.filter((entry) => entry.album.id !== albumId);
        }
    }

    @action.bound
    private applyArtistToggle(artistId: number, followed: boolean, artist?: Artist): void {
        const ids = new Set(this.followedArtistIds);
        if (followed) ids.add(artistId);
        else ids.delete(artistId);
        this.followedArtistIds = ids;

        if (followed) {
            if (artist && !this.followedArtists.some((entry) => entry.artist.id === artistId)) {
                const entry: FollowedArtistEntry = {
                    id: -artistId,
                    artist,
                    followedAt: new Date().toISOString(),
                };
                this.followedArtists = [entry, ...this.followedArtists];
            }
        } else {
            this.followedArtists = this.followedArtists.filter((entry) => entry.artist.id !== artistId);
        }
    }

    async toggleTrackSaved(trackId: number, track?: Track): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const previous = this.savedTrackIds.has(trackId);
        const outcome = await this.guard.run(`library:track:${trackId}`, async () => {
            const wasSaved = this.savedTrackIds.has(trackId);
            this.applyTrackToggle(trackId, !wasSaved, track);
            const method = wasSaved ? "DELETE" : "PUT";
            const result = await apiRequest<{ saved: boolean }>(method, `/library/tracks/${trackId}/`);
            if (!result.ok) {
                this.applyTrackToggle(trackId, wasSaved, track);
                Log.APIError(`[library] toggle track failed: ${result.error?.message ?? "unknown"}`);
                return wasSaved;
            }
            return result.data?.saved ?? !wasSaved;
        });
        return outcome ?? previous;
    }

    async toggleAlbumSaved(albumId: number, album?: Album): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const previous = this.savedAlbumIds.has(albumId);
        const outcome = await this.guard.run(`library:album:${albumId}`, async () => {
            const wasSaved = this.savedAlbumIds.has(albumId);
            this.applyAlbumToggle(albumId, !wasSaved, album);
            const method = wasSaved ? "DELETE" : "PUT";
            const result = await apiRequest<{ saved: boolean }>(method, `/library/albums/${albumId}/`);
            if (!result.ok) {
                this.applyAlbumToggle(albumId, wasSaved, album);
                return wasSaved;
            }
            return result.data?.saved ?? !wasSaved;
        });
        return outcome ?? previous;
    }

    async toggleArtistFollowed(artistId: number, artist?: Artist): Promise<boolean> {
        if (!this.auth.isAuthenticated) return false;
        const previous = this.followedArtistIds.has(artistId);
        const outcome = await this.guard.run(`library:artist:${artistId}`, async () => {
            const wasFollowing = this.followedArtistIds.has(artistId);
            this.applyArtistToggle(artistId, !wasFollowing, artist);
            const method = wasFollowing ? "DELETE" : "PUT";
            const result = await apiRequest<{ following: boolean }>(method, `/library/artists/${artistId}/`);
            if (!result.ok) {
                this.applyArtistToggle(artistId, wasFollowing, artist);
                return wasFollowing;
            }
            return result.data?.following ?? !wasFollowing;
        });
        return outcome ?? previous;
    }

    @action.bound
    private upsertPlaylistInList(detail: PlaylistDetail): void {
        const summary = this.toSummary(detail);
        const existing = this.myPlaylists.findIndex((p) => p.id === summary.id);
        if (existing === -1) {
            this.myPlaylists = [summary, ...this.myPlaylists];
            return;
        }
        const next = [...this.myPlaylists];
        next[existing] = summary;
        this.myPlaylists = next;
    }

    @action.bound
    private bumpPlaylistTrackCount(playlistId: number, delta: number): void {
        this.myPlaylists = this.myPlaylists.map((p) =>
            p.id === playlistId
                ? { ...p, totalTracks: Math.max(0, p.totalTracks + delta), updatedAt: new Date().toISOString() }
                : p,
        );
    }

    private toSummary(detail: PlaylistDetail): PlaylistSummary {
        return {
            id: detail.id,
            owner: detail.owner,
            title: detail.title,
            slug: detail.slug,
            description: detail.description,
            cover: detail.cover,
            isPublic: detail.isPublic,
            isCollaborative: detail.isCollaborative,
            isSystem: detail.isSystem,
            totalTracks: detail.totalTracks,
            sortOrder: detail.sortOrder,
            updatedAt: detail.updatedAt,
        };
    }

    async createPlaylist(title: string, description: string = ""): Promise<PlaylistDetail | null> {
        return (
            (await this.guard.run("library:playlist:create", async () => {
                const result = await apiRequest<PlaylistDetail>("POST", "/playlists/", {
                    body: { title, description, isPublic: true },
                });
                if (!result.ok || !result.data) return null;
                this.upsertPlaylistInList(result.data);
                return result.data;
            })) ?? null
        );
    }

    async updatePlaylist(
        id: number,
        patch: { title?: string; description?: string; isPublic?: boolean; isCollaborative?: boolean },
    ): Promise<PlaylistDetail | null> {
        return (
            (await this.guard.run(`library:playlist:update:${id}`, async () => {
                const result = await apiRequest<PlaylistDetail>("PATCH", `/playlists/${id}/`, { body: patch });
                if (!result.ok || !result.data) return null;
                this.upsertPlaylistInList(result.data);
                return result.data;
            })) ?? null
        );
    }

    async deletePlaylist(id: number): Promise<boolean> {
        const outcome = await this.guard.run(`library:playlist:delete:${id}`, async () => {
            const result = await apiRequest("DELETE", `/playlists/${id}/`);
            if (!result.ok) return false;
            runInAction(() => {
                this.myPlaylists = this.myPlaylists.filter((p) => p.id !== id);
            });
            return true;
        });
        return outcome ?? false;
    }

    async uploadPlaylistCover(id: number, file: File): Promise<PlaylistDetail | null> {
        return (
            (await this.guard.run(`library:playlist:cover-upload:${id}`, async () => {
                const form = new FormData();
                form.append("cover", file);
                const result = await apiRequest<PlaylistDetail>("POST", `/playlists/${id}/cover/`, { body: form });
                if (!result.ok || !result.data) return null;
                this.upsertPlaylistInList(result.data);
                return result.data;
            })) ?? null
        );
    }

    async removePlaylistCover(id: number): Promise<PlaylistDetail | null> {
        return (
            (await this.guard.run(`library:playlist:cover-remove:${id}`, async () => {
                const result = await apiRequest<PlaylistDetail>("DELETE", `/playlists/${id}/cover/`);
                if (!result.ok || !result.data) return null;
                this.upsertPlaylistInList(result.data);
                return result.data;
            })) ?? null
        );
    }

    async addTracksToPlaylist(playlistId: number, trackIds: number[]): Promise<boolean> {
        const outcome = await this.guard.run(`library:playlist:add-tracks:${playlistId}`, async () => {
            const result = await apiRequest("POST", `/playlists/${playlistId}/items/`, {
                body: { trackIds },
            });
            if (result.ok) this.bumpPlaylistTrackCount(playlistId, trackIds.length);
            return result.ok;
        });
        return outcome ?? false;
    }

    async movePlaylistItem(playlistId: number, itemId: number, position: number): Promise<boolean> {
        const outcome = await this.guard.run(`library:playlist:move-item:${playlistId}:${itemId}`, async () => {
            const result = await apiRequest("PATCH", `/playlists/${playlistId}/items/${itemId}/`, {
                body: { position },
            });
            return result.ok;
        });
        return outcome ?? false;
    }

    async removePlaylistItem(playlistId: number, itemId: number): Promise<boolean> {
        const outcome = await this.guard.run(`library:playlist:remove-item:${playlistId}:${itemId}`, async () => {
            const result = await apiRequest("DELETE", `/playlists/${playlistId}/items/${itemId}/`);
            if (result.ok) this.bumpPlaylistTrackCount(playlistId, -1);
            return result.ok;
        });
        return outcome ?? false;
    }
}
