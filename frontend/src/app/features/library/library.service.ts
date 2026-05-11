import { action, makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocationService } from "@/app/core/services/location.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { inject, injectable } from "@/app/shared/decorators/di";

export type LibraryTab = "playlists" | "albums" | "artists";

const TAB_PARAM = "tab";
const VALID_TABS: readonly LibraryTab[] = ["playlists", "albums", "artists"];
const DEFAULT_TAB: LibraryTab = "playlists";

const isLibraryTab = (value: string | null): value is LibraryTab =>
    value !== null && (VALID_TABS as readonly string[]).includes(value);

@injectable()
export class LibraryPageService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly library: LibraryService = inject(LibraryService);
    private readonly location: LocationService = inject(LocationService);
    private readonly navigate: NavigateService = inject(NavigateService);
    private readonly disposable: DisposableService = inject(DisposableService);

    @observable activeTab: LibraryTab = DEFAULT_TAB;
    @observable hasInitialized: boolean = false;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    setTab(tab: LibraryTab): void {
        if (this.activeTab !== tab) {
            this.activeTab = tab;
        }
        this.writeTabToUrl(tab);
    }

    async initialize(): Promise<void> {
        this.applyTabFromUrl();
        this.disposable.register(
            "library-tab-url-reaction",
            reaction(
                () => this.location.location.search,
                () => this.applyTabFromUrl(),
            ),
        );
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

    dispose(): void {
        this.disposable.dispose();
    }

    @action
    private applyTabFromUrl(): void {
        const params = new URLSearchParams(this.location.location.search);
        const next = params.get(TAB_PARAM);
        if (isLibraryTab(next)) {
            if (this.activeTab !== next) this.activeTab = next;
        } else if (this.activeTab !== DEFAULT_TAB) {
            this.activeTab = DEFAULT_TAB;
        }
    }

    private writeTabToUrl(tab: LibraryTab): void {
        const current = this.location.location;
        const params = new URLSearchParams(current.search);
        if (params.get(TAB_PARAM) === tab) return;
        if (tab === DEFAULT_TAB) {
            params.delete(TAB_PARAM);
        } else {
            params.set(TAB_PARAM, tab);
        }
        const query = params.toString();
        const target = query ? `${current.pathname}?${query}` : current.pathname;
        this.navigate.navigate(target, { replace: true });
    }
}
