import { action, makeObservable, observable, runInAction } from "mobx";

import { config } from "@/app/app.config";
import { Album, AlbumDetail } from "@/app/core/types/album";
import { Artist, ArtistDetail } from "@/app/core/types/artist";
import { FeaturedPlaylist, Genre, PlaylistDetail } from "@/app/core/types/playlist";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";
import { ActionGuard } from "@/app/shared/utils/classes/ActionGuard";

import { apiRequest, apiUrl } from "../http/api-client";
import { SearchCacheEntry, SearchCacheService } from "./search-cache.service";

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

interface SearchOutcome {
    result: SearchResult;
    totalTracks: number;
    hasMore: boolean;
    fromCache: boolean;
}

const EMPTY_RESULT: SearchResult = { tracks: [], artists: [], albums: [] };
const DEFAULT_KINDS: SearchKind[] = ["track", "artist", "album"];

@injectable()
export class CatalogService {
    @observable lastQuery: string = "";
    @observable lastResult: SearchResult = EMPTY_RESULT;
    @observable isSearching: boolean = false;
    @observable isLoadingMore: boolean = false;
    @observable lastError: string = "";
    @observable searchTotalTracks: number = 0;
    @observable searchHasMore: boolean = false;

    private readonly cacheStore: SearchCacheService = inject(SearchCacheService);
    private readonly guard: ActionGuard = new ActionGuard();
    private activeRequest: AbortController | null = null;
    private inflightSearches: Map<string, Promise<SearchOutcome>> = new Map();

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

    async search(query: string, kinds: SearchKind[] = DEFAULT_KINDS): Promise<SearchResult> {
        const trimmed = query.trim();
        if (!trimmed) {
            this.resetSearchState();
            return EMPTY_RESULT;
        }

        const limit = config.CATALOG_PAGE_SIZE;
        const offset = 0;
        const cacheKey = SearchCacheService.buildKey({ query: trimmed, kinds, limit, offset });

        this.setQuery(trimmed);
        this.setError("");

        const cached = this.cacheStore.get(cacheKey);
        if (cached) {
            this.applySearchEntry(cached);
            return { tracks: cached.tracks, artists: cached.artists, albums: cached.albums };
        }

        const inflight = this.inflightSearches.get(cacheKey);
        if (inflight) {
            this.setSearching(true);
            const outcome = await inflight;
            return outcome.result;
        }

        this.activeRequest?.abort();
        const controller = new AbortController();
        this.activeRequest = controller;
        this.setSearching(true);

        const promise = this.fetchSearch({ query: trimmed, kinds, limit, offset, signal: controller.signal });
        this.inflightSearches.set(cacheKey, promise);

        let outcome: SearchOutcome;
        try {
            outcome = await promise;
        } finally {
            this.inflightSearches.delete(cacheKey);
            if (this.activeRequest === controller) this.activeRequest = null;
        }

        if (controller.signal.aborted) return EMPTY_RESULT;

        if (!outcome.fromCache) {
            this.cacheStore.set(cacheKey, {
                tracks: outcome.result.tracks,
                artists: outcome.result.artists,
                albums: outcome.result.albums,
                totalTracks: outcome.totalTracks,
                hasMore: outcome.hasMore,
                offset,
                limit,
            });
        }
        return outcome.result;
    }

    async loadMoreSearchTracks(): Promise<void> {
        if (this.isLoadingMore || !this.searchHasMore || !this.lastQuery) return;
        const limit = config.CATALOG_PAGE_SIZE;
        const offset = this.lastResult.tracks.length;
        const cacheKey = SearchCacheService.buildKey({
            query: this.lastQuery,
            kinds: ["track"],
            limit,
            offset,
        });

        runInAction(() => {
            this.isLoadingMore = true;
        });

        const cached = this.cacheStore.get(cacheKey);
        if (cached) {
            this.appendMoreTracks(cached.tracks, cached.totalTracks, cached.hasMore);
            runInAction(() => {
                this.isLoadingMore = false;
            });
            return;
        }

        const result = await apiRequest<SearchEnvelope>("GET", "/catalog/search/", {
            params: {
                q: this.lastQuery,
                type: "track",
                limit,
                offset,
            },
        });

        runInAction(() => {
            this.isLoadingMore = false;
        });

        if (!result.ok || !result.data) return;

        const incoming = result.data.tracks ?? [];
        const totalTracks = result.data.totalTracks ?? this.lastResult.tracks.length + incoming.length;
        const hasMore = !!result.data.hasMore;

        this.cacheStore.set(cacheKey, {
            tracks: incoming,
            artists: [],
            albums: [],
            totalTracks,
            hasMore,
            offset,
            limit,
        });
        this.appendMoreTracks(incoming, totalTracks, hasMore);
    }

    invalidateSearchCache(query?: string): void {
        if (!query) {
            this.cacheStore.clear();
            return;
        }
        this.cacheStore.invalidatePrefix(`${query.trim().toLowerCase()}|`);
    }

    private async fetchSearch(input: {
        query: string;
        kinds: SearchKind[];
        limit: number;
        offset: number;
        signal: AbortSignal;
    }): Promise<SearchOutcome> {
        const result = await apiRequest<SearchEnvelope>("GET", "/catalog/search/", {
            params: {
                q: input.query,
                type: input.kinds.join(","),
                limit: input.limit,
                offset: input.offset,
            },
            signal: input.signal,
        });

        if (input.signal.aborted) {
            runInAction(() => {
                this.isSearching = false;
            });
            return { result: EMPTY_RESULT, totalTracks: 0, hasMore: false, fromCache: false };
        }

        if (!result.ok || !result.data) {
            const aborted = result.status === 0 && input.signal.aborted;
            if (aborted) {
                runInAction(() => {
                    this.isSearching = false;
                });
                return { result: EMPTY_RESULT, totalTracks: 0, hasMore: false, fromCache: false };
            }
            runInAction(() => {
                this.lastError = result.error?.message ?? "Search failed";
                this.isSearching = false;
                this.searchTotalTracks = 0;
                this.searchHasMore = false;
            });
            return { result: EMPTY_RESULT, totalTracks: 0, hasMore: false, fromCache: false };
        }

        const next: SearchResult = {
            tracks: result.data.tracks ?? [],
            artists: result.data.artists ?? [],
            albums: result.data.albums ?? [],
        };
        const totalTracks = result.data.totalTracks ?? next.tracks.length;
        const hasMore = !!result.data.hasMore;

        runInAction(() => {
            this.lastResult = next;
            this.isSearching = false;
            this.searchTotalTracks = totalTracks;
            this.searchHasMore = hasMore;
        });

        return { result: next, totalTracks, hasMore, fromCache: false };
    }

    private applySearchEntry(entry: SearchCacheEntry): void {
        runInAction(() => {
            this.lastResult = {
                tracks: entry.tracks,
                artists: entry.artists,
                albums: entry.albums,
            };
            this.searchTotalTracks = entry.totalTracks;
            this.searchHasMore = entry.hasMore;
            this.isSearching = false;
            this.lastError = "";
        });
    }

    private appendMoreTracks(incoming: Track[], totalTracks: number, hasMore: boolean): void {
        runInAction(() => {
            const knownIds = new Set(this.lastResult.tracks.map((t) => t.id));
            const merged = [...this.lastResult.tracks, ...incoming.filter((t) => !knownIds.has(t.id))];
            this.lastResult = { ...this.lastResult, tracks: merged };
            this.searchTotalTracks = totalTracks;
            this.searchHasMore = hasMore;
        });
    }

    private resetSearchState(): void {
        this.activeRequest?.abort();
        this.activeRequest = null;
        runInAction(() => {
            this.lastResult = EMPTY_RESULT;
            this.lastError = "";
            this.searchTotalTracks = 0;
            this.searchHasMore = false;
            this.isSearching = false;
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
        return (
            (await this.guard.run(`catalog:recent-push:${trimmed.toLowerCase()}`, async () => {
                const result = await apiRequest<RecentSearchEntry>("POST", "/catalog/recent-searches/", {
                    body: { query: trimmed },
                });
                return result.ok ? result.data : null;
            })) ?? null
        );
    }

    async removeRecentSearch(entryId: number): Promise<boolean> {
        const outcome = await this.guard.run(`catalog:recent-remove:${entryId}`, async () => {
            const result = await apiRequest("DELETE", `/catalog/recent-searches/${entryId}/`);
            return result.ok;
        });
        return outcome ?? false;
    }

    async clearRecentSearches(): Promise<boolean> {
        const outcome = await this.guard.run("catalog:recent-clear", async () => {
            const result = await apiRequest("DELETE", "/catalog/recent-searches/");
            return result.ok;
        });
        return outcome ?? false;
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
