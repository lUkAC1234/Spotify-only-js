import { makeObservable, observable, runInAction } from "mobx";

import { SocialService } from "@/app/core/services/social/social.service";
import { PlaylistSummary } from "@/app/core/types/playlist";
import { PublicUser } from "@/app/core/types/user";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class UserPageService {
    private readonly social: SocialService = inject(SocialService);

    @observable profile: PublicUser | null = null;
    @observable playlists: PlaylistSummary[] = [];
    @observable isLoading: boolean = false;
    @observable lastError: string = "";

    constructor() {
        makeObservable(this);
    }

    async load(userId: number | string): Promise<void> {
        runInAction(() => {
            this.isLoading = true;
            this.lastError = "";
        });
        const [profile, playlists] = await Promise.all([
            this.social.getProfile(userId),
            this.social.getPublicPlaylists(userId),
        ]);
        runInAction(() => {
            this.profile = profile;
            this.playlists = playlists;
            this.lastError = profile ? "" : "not_found";
            this.isLoading = false;
        });
    }

    async toggleFollow(): Promise<void> {
        if (!this.profile) return;
        const wasFollowing = this.profile.isFollowing;
        const next = await this.social.toggleFollow(this.profile.id, wasFollowing);
        runInAction(() => {
            if (this.profile) {
                this.profile = {
                    ...this.profile,
                    isFollowing: next,
                    followersCount: next
                        ? this.profile.followersCount + (wasFollowing ? 0 : 1)
                        : Math.max(0, this.profile.followersCount - (wasFollowing ? 1 : 0)),
                };
            }
        });
    }
}
