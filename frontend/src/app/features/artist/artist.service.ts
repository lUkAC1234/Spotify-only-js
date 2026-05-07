import { makeObservable, observable, runInAction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { ArtistDetail } from "@/app/core/types/artist";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class ArtistPageService {
    private readonly catalog: CatalogService = inject(CatalogService);

    @observable detail: ArtistDetail | null = null;
    @observable isLoading: boolean = false;
    @observable lastError: string = "";

    constructor() {
        makeObservable(this);
    }

    async load(artistId: number | string): Promise<void> {
        runInAction(() => {
            this.isLoading = true;
            this.lastError = "";
        });
        const detail = await this.catalog.getArtist(artistId);
        runInAction(() => {
            this.detail = detail;
            this.lastError = detail ? "" : "not_found";
            this.isLoading = false;
        });
    }
}
