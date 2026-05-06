import { action, makeObservable, observable, runInAction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class HomeService {
    private readonly catalog: CatalogService = inject(CatalogService);

    @observable popular: Track[] = [];
    @observable madeForYou: Track[] = [];
    @observable newReleases: Track[] = [];
    @observable featured: Track[] = [];
    @observable isLoading: boolean = false;
    @observable hasLoaded: boolean = false;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    private setLoading(value: boolean): void {
        this.isLoading = value;
    }

    async load(): Promise<void> {
        if (this.isLoading) return;
        this.setLoading(true);
        try {
            const [popular, fresh] = await Promise.all([
                this.catalog.getPopularTracks(12),
                this.catalog.getNewReleases(12),
            ]);
            runInAction(() => {
                this.popular = popular;
                this.madeForYou = popular.length > 6 ? [...popular].reverse() : popular;
                this.newReleases = fresh;
                this.featured = fresh.length > 6 ? [...fresh].reverse() : fresh;
                this.hasLoaded = true;
                this.isLoading = false;
            });
        } catch {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }
}
