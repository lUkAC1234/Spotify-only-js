import { injectable } from "@/app/shared/decorators/di";

import type { SearchKind, SearchResult } from "./catalog.service";

export interface SearchCacheEntry {
    tracks: SearchResult["tracks"];
    artists: SearchResult["artists"];
    albums: SearchResult["albums"];
    totalTracks: number;
    hasMore: boolean;
    offset: number;
    limit: number;
}

export interface SearchCacheKeyParts {
    query: string;
    kinds: readonly SearchKind[];
    limit: number;
    offset: number;
}

interface StoredEntry {
    key: string;
    value: SearchCacheEntry;
    expiresAt: number;
    touchedAt: number;
}

const STORAGE_KEY = "spotify:search-cache:v1";
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 64;

@injectable()
export class SearchCacheService {
    private readonly entries: Map<string, StoredEntry> = new Map();
    private hydrated: boolean = false;

    static buildKey({ query, kinds, limit, offset }: SearchCacheKeyParts): string {
        const normalizedQuery = query.trim().toLowerCase();
        const normalizedKinds = [...kinds].map((k) => k.toLowerCase()).sort().join(",");
        return `${normalizedQuery}|${normalizedKinds}|${limit}|${offset}`;
    }

    get(key: string): SearchCacheEntry | null {
        this.ensureHydrated();
        const entry = this.entries.get(key);
        if (!entry) return null;
        if (entry.expiresAt < Date.now()) {
            this.entries.delete(key);
            this.persist();
            return null;
        }
        entry.touchedAt = Date.now();
        return entry.value;
    }

    set(key: string, value: SearchCacheEntry, ttlMs: number = DEFAULT_TTL_MS): void {
        this.ensureHydrated();
        const now = Date.now();
        this.entries.set(key, {
            key,
            value,
            expiresAt: now + ttlMs,
            touchedAt: now,
        });
        this.evict();
        this.persist();
    }

    invalidatePrefix(prefix: string): void {
        this.ensureHydrated();
        const lower = prefix.toLowerCase();
        let mutated = false;
        for (const key of this.entries.keys()) {
            if (key.startsWith(lower)) {
                this.entries.delete(key);
                mutated = true;
            }
        }
        if (mutated) this.persist();
    }

    clear(): void {
        this.entries.clear();
        this.persist();
    }

    private evict(): void {
        if (this.entries.size <= MAX_ENTRIES) return;
        const sorted = Array.from(this.entries.values()).sort((a, b) => a.touchedAt - b.touchedAt);
        const overflow = this.entries.size - MAX_ENTRIES;
        for (let index = 0; index < overflow; index += 1) {
            this.entries.delete(sorted[index].key);
        }
    }

    private ensureHydrated(): void {
        if (this.hydrated) return;
        this.hydrated = true;
        if (typeof sessionStorage === "undefined") return;
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as StoredEntry[];
            const now = Date.now();
            for (const entry of parsed) {
                if (entry?.key && entry.expiresAt > now) {
                    this.entries.set(entry.key, entry);
                }
            }
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }

    private persist(): void {
        if (typeof sessionStorage === "undefined") return;
        try {
            const snapshot = Array.from(this.entries.values());
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }
}
