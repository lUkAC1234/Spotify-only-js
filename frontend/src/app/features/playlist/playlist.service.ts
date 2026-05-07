import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { PlaylistDetail, PlaylistItem } from "@/app/core/types/playlist";
import { inject, injectable } from "@/app/shared/decorators/di";
import { Log } from "@/app/shared/utils/functions/logger";

@injectable()
export class PlaylistPageService {
    private readonly catalog: CatalogService = inject(CatalogService);
    private readonly library: LibraryService = inject(LibraryService);

    @observable detail: PlaylistDetail | null = null;
    @observable isLoading: boolean = false;
    @observable lastError: string = "";

    constructor() {
        makeObservable(this);
    }

    @computed
    get tracks() {
        return this.detail?.items.map((item) => item.track) ?? [];
    }

    @computed
    get totalDurationMs(): number {
        return this.detail?.totalDurationMs ?? 0;
    }

    @action.bound
    private setDetail(detail: PlaylistDetail | null): void {
        this.detail = detail;
    }

    @action.bound
    private setLoading(value: boolean): void {
        this.isLoading = value;
    }

    @action.bound
    private setError(message: string): void {
        this.lastError = message;
    }

    @action.bound
    private patchItems(items: PlaylistItem[]): void {
        if (!this.detail) return;
        this.detail = {
            ...this.detail,
            items,
            totalTracks: items.length,
            totalDurationMs: items.reduce((sum, item) => sum + (item.track.durationMs || 0), 0),
        };
    }

    async load(playlistId: number | string): Promise<void> {
        this.setLoading(true);
        this.setError("");
        const detail = await this.catalog.getPlaylistDetail(playlistId);
        runInAction(() => {
            this.detail = detail;
            this.lastError = detail ? "" : "not_found";
            this.isLoading = false;
        });
    }

    async reorderItem(itemId: number, toIndex: number): Promise<void> {
        if (!this.detail) return;
        const items = [...this.detail.items];
        const fromIndex = items.findIndex((item) => item.id === itemId);
        if (fromIndex < 0 || fromIndex === toIndex) return;
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        const repositioned = items.map((item, index) => ({ ...item, position: index + 1 }));
        this.patchItems(repositioned);

        const ok = await this.library.movePlaylistItem(this.detail.id, itemId, toIndex + 1);
        if (!ok) {
            Log.APIError("[playlist] move failed");
            await this.load(this.detail.id);
        }
    }

    async removeItem(itemId: number): Promise<void> {
        if (!this.detail) return;
        const remaining = this.detail.items.filter((item) => item.id !== itemId);
        this.patchItems(remaining.map((item, index) => ({ ...item, position: index + 1 })));

        const ok = await this.library.removePlaylistItem(this.detail.id, itemId);
        if (!ok) {
            await this.load(this.detail.id);
        }
    }

    async patchMeta(patch: { title?: string; description?: string; isPublic?: boolean; isCollaborative?: boolean }) {
        if (!this.detail) return;
        const updated = await this.library.updatePlaylist(this.detail.id, patch);
        if (updated) {
            this.setDetail(updated);
        }
    }

    async deletePlaylist(): Promise<boolean> {
        if (!this.detail) return false;
        const ok = await this.library.deletePlaylist(this.detail.id);
        if (ok) {
            this.setDetail(null);
        }
        return ok;
    }
}
