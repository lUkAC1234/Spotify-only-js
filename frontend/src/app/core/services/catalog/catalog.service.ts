import { action, makeObservable, observable, runInAction } from "mobx";

import { config } from "@/app/app.config";
import { Album } from "@/app/core/types/album";
import { Artist } from "@/app/core/types/artist";
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
}

const EMPTY_RESULT: SearchResult = { tracks: [], artists: [], albums: [] };

@injectable()
export class CatalogService {
    @observable lastQuery: string = "";
    @observable lastResult: SearchResult = EMPTY_RESULT;
    @observable isSearching: boolean = false;
    @observable lastError: string = "";

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
        });
        return next;
    }

    async getTrack(id: number | string): Promise<Track | null> {
        const result = await apiRequest<Track>("GET", `/catalog/track/${id}/`);
        return result.ok ? result.data : null;
    }

    async getAlbum(id: number | string): Promise<Album | null> {
        const result = await apiRequest<Album>("GET", `/catalog/album/${id}/`);
        return result.ok ? result.data : null;
    }

    async getArtist(id: number | string): Promise<Artist | null> {
        const result = await apiRequest<Artist>("GET", `/catalog/artist/${id}/`);
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

    streamUrl(trackId: number | string): string {
        return apiUrl(`/stream/${trackId}/`);
    }
}
