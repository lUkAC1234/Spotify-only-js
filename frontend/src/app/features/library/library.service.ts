import { action, makeObservable, observable, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { inject, injectable } from "@/app/shared/decorators/di";

export type LibraryTab = "playlists" | "albums" | "artists";

@injectable()
export class LibraryPageService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly library: LibraryService = inject(LibraryService);

    @observable activeTab: LibraryTab = "playlists";
    @observable hasInitialized: boolean = false;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    setTab(tab: LibraryTab): void {
        this.activeTab = tab;
    }

    async initialize(): Promise<void> {
        if (!this.auth.isAuthenticated) return;
        await Promise.all([
            this.library.fetchSavedTracks(50),
            this.library.fetchSavedAlbums(50),
            this.library.fetchFollowedArtists(50),
            this.library.fetchMyPlaylists(),
        ]);
        runInAction(() => {
            this.hasInitialized = true;
        });
    }
}
