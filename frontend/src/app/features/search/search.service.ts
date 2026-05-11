import { action, makeObservable, observable, reaction, runInAction } from "mobx";

import { config } from "@/app/app.config";
import { AuthService } from "@/app/core/services/auth/auth.service";
import { CatalogService, RecentSearchEntry } from "@/app/core/services/catalog/catalog.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocationService } from "@/app/core/services/location.service";
import { Genre } from "@/app/core/types/playlist";
import { inject, injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";

@injectable()
export class SearchService {
    private readonly catalog: CatalogService = inject(CatalogService);
    private readonly auth: AuthService = inject(AuthService);
    private readonly location: LocationService = inject(LocationService);
    private readonly disposable: DisposableService = inject(DisposableService);

    @observable genres: Genre[] = [];
    @observable recentSearches: RecentSearchEntry[] = [];
    @observable isLoadingDiscovery: boolean = false;
    @observable hasLoadedGenres: boolean = false;
    @observable hasLoadedRecents: boolean = false;

    private debouncedFetch = debounce(
        (query: string) => {
            void this.runSearch(query);
        },
        config.SEARCH_DEBOUNCE_MS,
        { leading: false, trailing: true },
    );

    constructor() {
        makeObservable(this);
    }

    init(): void {
        this.disposable.register(
            "search-query-reaction",
            reaction(
                () => this.queryFromUrl,
                (query) => {
                    if (!query || query.length < config.SEARCH_MIN_QUERY_LENGTH) {
                        this.debouncedFetch.cancel();
                        this.catalog.setQuery(query ?? "");
                        this.catalog.setResult({ tracks: [], artists: [], albums: [] });
                        return;
                    }
                    this.catalog.setQuery(query);
                    this.debouncedFetch(query);
                },
                { fireImmediately: true },
            ),
        );

        this.disposable.register(
            "search-discovery-reaction",
            reaction(
                () => this.auth.isAuthenticated,
                () => {
                    runInAction(() => {
                        this.hasLoadedRecents = false;
                    });
                    void this.loadDiscovery();
                },
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.debouncedFetch.cancel();
        this.disposable.dispose();
    }

    @action.bound
    private setLoadingDiscovery(value: boolean): void {
        this.isLoadingDiscovery = value;
    }

    @action.bound
    private setGenres(genres: Genre[]): void {
        this.genres = genres;
    }

    @action.bound
    private setRecentSearches(items: RecentSearchEntry[]): void {
        this.recentSearches = items;
    }

    private async runSearch(query: string): Promise<void> {
        const trimmed = query.trim();
        if (!trimmed) return;
        await this.catalog.search(trimmed);
        if (this.auth.isAuthenticated) {
            const entry = await this.catalog.pushRecentSearch(trimmed);
            if (entry) {
                runInAction(() => {
                    this.recentSearches = [entry, ...this.recentSearches.filter((r) => r.id !== entry.id)].slice(0, 10);
                });
            }
        }
    }

    async loadDiscovery(): Promise<void> {
        if (this.isLoadingDiscovery) return;
        const needsGenres = !this.hasLoadedGenres;
        const needsRecents = this.auth.isAuthenticated && !this.hasLoadedRecents;
        if (!needsGenres && !needsRecents) return;
        this.setLoadingDiscovery(true);
        try {
            const tasks: [Promise<Genre[] | null>, Promise<RecentSearchEntry[] | null>] = [
                needsGenres ? this.catalog.getGenres() : Promise.resolve(null),
                needsRecents ? this.catalog.getRecentSearches() : Promise.resolve(null),
            ];
            const [genres, recents] = await Promise.all(tasks);
            runInAction(() => {
                if (genres !== null) {
                    this.genres = genres;
                    this.hasLoadedGenres = true;
                }
                if (recents !== null) {
                    this.recentSearches = recents;
                    this.hasLoadedRecents = true;
                }
            });
        } finally {
            this.setLoadingDiscovery(false);
        }
    }

    async removeRecent(entryId: number): Promise<void> {
        const ok = await this.catalog.removeRecentSearch(entryId);
        if (!ok) return;
        runInAction(() => {
            this.recentSearches = this.recentSearches.filter((entry) => entry.id !== entryId);
        });
    }

    async clearRecent(): Promise<void> {
        const ok = await this.catalog.clearRecentSearches();
        if (!ok) return;
        runInAction(() => {
            this.recentSearches = [];
        });
    }

    get queryFromUrl(): string {
        const search = this.location.location.search;
        if (!search) return "";
        const params = new URLSearchParams(search);
        return (params.get("q") ?? "").trim();
    }
}
