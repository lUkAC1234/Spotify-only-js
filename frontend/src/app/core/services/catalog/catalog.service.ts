import { action, makeObservable, observable, runInAction } from "mobx";

import { config } from "@/app/app.config";
import { Album, AlbumDetail } from "@/app/core/types/album";
import { Artist, ArtistDetail } from "@/app/core/types/artist";
import { FeaturedPlaylist, Genre, PlaylistDetail } from "@/app/core/types/playlist";
import { Track } from "@/app/core/types/track";
import { injectable } from "@/app/shared/decorators/di";

import { apiRequest, apiUrl } from "../http/api-client";

export type SearchKind = "track" | "artist" | "album" | "playlist";

export interface SearchResult {
    tracks: Track[];
    artists: Artist[];
    albums: Album[];
}

interface SearchEnvelope {
    tracks?: Track[];
    artists?: Artist[];
    albums?: Album[];
    totalTracks?: number;
    hasMore?: boolean;
    offset?: number;
    limit?: number;
}

const EMPTY_RESULT: SearchResult = { tracks: [], artists: [], albums: [] };

@injectable()
export class CatalogService {
    @observable lastQuery: string = "";
    @observable lastResult: SearchResult = EMPTY_RESULT;
    @observable isSearching: boolean = false;
    @observable isLoadingMore: boolean = false;
    @observable lastError: string = "";
    @observable searchTotalTracks: number = 0;
    @observable searchHasMore: boolean = false;

    private activeRequest: AbortController | null = null;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    setQuery(query: string): void {
        this.lastQuery = query;
    }

    @action.bound
    setResult(result: SearchResult): void {
        this.lastResult = result;
    }

    @action.bound
    setSearching(value: boolean): void {
        this.isSearching = value;
    }

    @action.bound
    setError(message: string): void {
        this.lastError = message;
    }

    async search(query: string, kinds: SearchKind[] = ["track", "artist", "album"]): Promise<SearchResult> {
        const trimmed = query.trim();
        if (!trimmed) {
            this.setResult(EMPTY_RESULT);
            this.setError("");
            runInAction(() => {
                this.searchTotalTracks = 0;
                this.searchHasMore = false;
            });
            return EMPTY_RESULT;
        }

        this.activeRequest?.abort();
        const controller = new AbortController();
        this.activeRequest = controller;

        this.setQuery(trimmed);
        this.setSearching(true);
        this.setError("");

        const result = await apiRequest<SearchEnvelope>("GET", "/catalog/search/", {
            params: {
                q: trimmed,
                type: kinds.join(","),
                limit: config.CATALOG_PAGE_SIZE,
                offset: 0,
            },
            signal: controller.signal,
        });

        if (this.activeRequest === controller) this.activeRequest = null;

        if (!result.ok || !result.data) {
            const aborted = result.status === 0 && controller.signal.aborted;
            if (aborted) {
                runInAction(() => {
                    this.isSearching = false;
                });
                return EMPTY_RESULT;
            }
            runInAction(() => {
                this.lastError = result.error?.message ?? "Search failed";
                this.isSearching = false;
                this.searchTotalTracks = 0;
                this.searchHasMore = false;
            });
            return EMPTY_RESULT;
        }

        const next: SearchResult = {
            tracks: result.data.tracks ?? [],
            artists: result.data.artists ?? [],
            albums: result.data.albums ?? [],
        };

        runInAction(() => {
            this.lastResult = next;
            this.isSearching = false;
            this.searchTotalTracks = result.data?.totalTracks ?? next.tracks.length;
            this.searchHasMore = !!result.data?.hasMore;
        });
        return next;
    }

    async loadMoreSearchTracks(): Promise<void> {
        if (this.isLoadingMore || !this.searchHasMore || !this.lastQuery) return;
        runInAction(() => {
            this.isLoadingMore = true;
        });
        const offset = this.lastResult.tracks.length;
        const result = await apiRequest<SearchEnvelope>("GET", "/catalog/search/", {
            params: {
                q: this.lastQuery,
                type: "track",
                limit: config.CATALOG_PAGE_SIZE,
                offset,
            },
        });
        runInAction(() => {
            this.isLoadingMore = false;
            if (!result.ok || !result.data) return;
            const incoming = result.data.tracks ?? [];
            const knownIds = new Set(this.lastResult.tracks.map((t) => t.id));
            const merged = [...this.lastResult.tracks, ...incoming.filter((t) => !knownIds.has(t.id))];
            this.lastResult = { ...this.lastResult, tracks: merged };
            this.searchTotalTracks = result.data.totalTracks ?? merged.length;
            this.searchHasMore = !!result.data.hasMore;
        });
    }

    async getTrack(id: number | string): Promise<Track | null> {
        const result = await apiRequest<Track>("GET", `/catalog/track/${id}/`);
        return result.ok ? result.data : null;
    }

    async getAlbum(id: number | string): Promise<AlbumDetail | null> {
        const result = await apiRequest<AlbumDetail>("GET", `/catalog/album/${id}/`);
        return result.ok ? result.data : null;
    }

    async getArtist(id: number | string): Promise<ArtistDetail | null> {
        const result = await apiRequest<ArtistDetail>("GET", `/catalog/artist/${id}/`);
        return result.ok ? result.data : null;
    }

    async getPopularTracks(limit: number = 12): Promise<Track[]> {
        const result = await apiRequest<{ items: Track[] }>("GET", "/catalog/popular/", {
            params: { limit },
        });
        return result.ok && result.data ? result.data.items : [];
    }

    async getNewReleases(limit: number = 12): Promise<Track[]> {
        const result = await apiRequest<{ items: Track[] }>("GET", "/catalog/new-releases/", {
            params: { limit },
        });
        return result.ok && result.data ? result.data.items : [];
    }

    async getRecentlyPlayed(limit: number = 12): Promise<Track[]> {
        const result = await apiRequest<{ items: Track[] }>("GET", "/catalog/recently-played/", {
            params: { limit },
        });
        return result.ok && result.data ? result.data.items : [];
    }

    async getDailyMix(limit: number = 18): Promise<Track[]> {
        const result = await apiRequest<{ items: Track[] }>("GET", "/catalog/daily-mix/", {
            params: { limit },
        });
        return result.ok && result.data ? result.data.items : [];
    }

    async getRecommendations(
        limit: number = 18,
        seedGenres: string[] = [],
    ): Promise<{ tracks: Track[]; seedGenres: string[] }> {
        const params: Record<string, string | number> = { limit };
        if (seedGenres.length > 0) params.seed_genres = seedGenres.join(",");
        const result = await apiRequest<{ items: Track[]; seedGenres?: string[] }>(
            "GET",
            "/catalog/recommendations/",
            { params },
        );
        if (!result.ok || !result.data) return { tracks: [], seedGenres: [] };
        return {
            tracks: result.data.items ?? [],
            seedGenres: result.data.seedGenres ?? [],
        };
    }

    async getFeaturedPlaylists(): Promise<FeaturedPlaylist[]> {
        const result = await apiRequest<{ items: FeaturedPlaylist[] }>("GET", "/catalog/featured-playlists/");
        return result.ok && result.data ? result.data.items : [];
    }

    async getPlaylistDetail(id: number | string): Promise<PlaylistDetail | null> {
        const result = await apiRequest<PlaylistDetail>("GET", `/playlists/${id}/`);
        return result.ok ? result.data : null;
    }

    async getGenres(): Promise<Genre[]> {
        const result = await apiRequest<{ items: Genre[] }>("GET", "/catalog/genres/");
        return result.ok && result.data ? result.data.items : [];
    }

    async getGenreTracks(slug: string, limit: number = 18): Promise<Track[]> {
        const result = await apiRequest<{ slug: string; items: Track[] }>(
            "GET",
            `/catalog/genre/${encodeURIComponent(slug)}/`,
            { params: { limit } },
        );
        return result.ok && result.data ? result.data.items : [];
    }

    async getRecentSearches(): Promise<RecentSearchEntry[]> {
        const result = await apiRequest<{ items: RecentSearchEntry[] }>("GET", "/catalog/recent-searches/");
        return result.ok && result.data ? result.data.items : [];
    }

    async pushRecentSearch(query: string): Promise<RecentSearchEntry | null> {
        const trimmed = query.trim();
        if (!trimmed) return null;
        const result = await apiRequest<RecentSearchEntry>("POST", "/catalog/recent-searches/", {
            body: { query: trimmed },
        });
        return result.ok ? result.data : null;
    }

    async removeRecentSearch(entryId: number): Promise<boolean> {
        const result = await apiRequest("DELETE", `/catalog/recent-searches/${entryId}/`);
        return result.ok;
    }

    async clearRecentSearches(): Promise<boolean> {
        const result = await apiRequest("DELETE", "/catalog/recent-searches/");
        return result.ok;
    }

    streamUrl(trackId: number | string): string {
        return apiUrl(`/stream/${trackId}/`);
    }
}

export interface RecentSearchEntry {
    id: number;
    query: string;
    searchedAt: string;
}
