import { action, makeObservable, observable } from "mobx";

import { PlaylistDetail, PlaylistSummary } from "@/app/core/types/playlist";
import { injectable } from "@/app/shared/decorators/di";

interface EditingTarget {
    id: number;
    title: string;
    description: string;
    cover: string;
}

@injectable()
export class CreatePlaylistModalService {
    @observable isOpen: boolean = false;
    @observable editing: EditingTarget | null = null;
    private onSavedCallback: ((id: number) => void) | null = null;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    open(): void {
        this.editing = null;
        this.onSavedCallback = null;
        this.isOpen = true;
    }

    @action.bound
    openEdit(playlist: PlaylistSummary | PlaylistDetail, onSaved?: (id: number) => void): void {
        this.editing = {
            id: playlist.id,
            title: playlist.title,
            description: playlist.description ?? "",
            cover: playlist.cover ?? "",
        };
        this.onSavedCallback = onSaved ?? null;
        this.isOpen = true;
    }

    @action.bound
    close(): void {
        this.isOpen = false;
        this.editing = null;
        this.onSavedCallback = null;
    }

    notifySaved(id: number): void {
        if (this.onSavedCallback) this.onSavedCallback(id);
    }
}
