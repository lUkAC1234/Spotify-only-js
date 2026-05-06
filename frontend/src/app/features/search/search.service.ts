import { reaction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocationService } from "@/app/core/services/location.service";
import { inject, injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";

import { config } from "@/app/app.config";

@injectable()
export class SearchService {
    private readonly catalog: CatalogService = inject(CatalogService);
    private readonly location: LocationService = inject(LocationService);
    private readonly disposable: DisposableService = inject(DisposableService);

    private debouncedFetch = debounce((query: string) => {
        this.catalog.search(query);
    }, config.SEARCH_DEBOUNCE_MS);

    init(): void {
        this.disposable.register(
            "search-query-reaction",
            reaction(
                () => this.queryFromUrl,
                (query) => {
                    if (!query) {
                        this.catalog.setQuery("");
                        this.catalog.setResult({ tracks: [], artists: [], albums: [] });
                        return;
                    }
                    this.catalog.setQuery(query);
                    this.debouncedFetch(query);
                },
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.debouncedFetch.cancel();
        this.disposable.dispose();
    }

    get queryFromUrl(): string {
        const search = this.location.location.search;
        if (!search) return "";
        const params = new URLSearchParams(search);
        return (params.get("q") ?? "").trim();
    }
}
