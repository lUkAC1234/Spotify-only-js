import { makeObservable, observable, runInAction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { AlbumDetail } from "@/app/core/types/album";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class AlbumPageService {
    private readonly catalog: CatalogService = inject(CatalogService);

    @observable detail: AlbumDetail | null = null;
    @observable isLoading: boolean = false;
    @observable lastError: string = "";

    constructor() {
        makeObservable(this);
    }

    async load(albumId: number | string): Promise<void> {
        runInAction(() => {
            this.isLoading = true;
            this.lastError = "";
        });
        const detail = await this.catalog.getAlbum(albumId);
        runInAction(() => {
            this.detail = detail;
            this.lastError = detail ? "" : "not_found";
            this.isLoading = false;
        });
    }
}
