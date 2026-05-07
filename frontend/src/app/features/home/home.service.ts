import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { Artist } from "@/app/core/types/artist";
import { FeaturedPlaylist } from "@/app/core/types/playlist";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class HomeService {
    private readonly catalog: CatalogService = inject(CatalogService);
    private readonly auth: AuthService = inject(AuthService);

    @observable recentlyPlayed: Track[] = [];
    @observable madeForYou: Track[] = [];
    @observable newReleases: Track[] = [];
    @observable featuredPlaylists: FeaturedPlaylist[] = [];
    @observable recommendations: Track[] = [];
    @observable recommendationSeeds: string[] = [];
    @observable popular: Track[] = [];

    @observable isLoading: boolean = false;
    @observable hasLoaded: boolean = false;
    @observable lastError: string = "";

    constructor() {
        makeObservable(this);
    }

    @computed
    get popularArtists(): Artist[] {
        const seen = new Set<number>();
        const result: Artist[] = [];
        for (const track of this.popular) {
            const artist = track.artist;
            if (!artist || seen.has(artist.id)) continue;
            seen.add(artist.id);
            result.push(artist);
            if (result.length >= 12) break;
        }
        return result;
    }

    @action.bound
    private setLoading(value: boolean): void {
        this.isLoading = value;
    }

    @action.bound
    private setError(message: string): void {
        this.lastError = message;
    }

    async load(): Promise<void> {
        if (this.isLoading) return;
        this.setLoading(true);
        this.setError("");

        const isAuthed = this.auth.isAuthenticated;

        try {
            const [popular, fresh, featured, recommendations, recently, mix] = await Promise.all([
                this.catalog.getPopularTracks(18),
                this.catalog.getNewReleases(18),
                this.catalog.getFeaturedPlaylists(),
                this.catalog.getRecommendations(18),
                isAuthed ? this.catalog.getRecentlyPlayed(12) : Promise.resolve<Track[]>([]),
                isAuthed ? this.catalog.getDailyMix(18) : Promise.resolve<Track[]>([]),
            ]);

            runInAction(() => {
                this.popular = popular;
                this.newReleases = fresh;
                this.featuredPlaylists = featured;
                this.recommendations = recommendations.tracks;
                this.recommendationSeeds = recommendations.seedGenres;
                this.recentlyPlayed = recently;
                this.madeForYou = mix.length > 0 ? mix : popular.slice(0, 12);
                this.hasLoaded = true;
                this.isLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.lastError = (err as Error).message || "Could not load home feed";
                this.isLoading = false;
            });
        }
    }
}
