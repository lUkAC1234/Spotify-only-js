import { makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { FeedEntry, FollowEntry, FriendListening, YearlyRecap } from "@/app/core/types/social";
import { PrivacyPatch, PublicUser } from "@/app/core/types/user";
import { inject, injectable } from "@/app/shared/decorators/di";
import { ActionGuard } from "@/app/shared/utils/classes/ActionGuard";

import { apiRequest } from "../http/api-client";
import { PlaylistSummary } from "@/app/core/types/playlist";

const FRIENDS_POLL_INTERVAL_MS = 30_000;

@injectable()
export class SocialService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly disposable: DisposableService = inject(DisposableService);

    @observable friendsActivity: FriendListening[] = [];
    @observable isLoadingFriends: boolean = false;

    private pollHandle: ReturnType<typeof setInterval> | null = null;
    private isMounted: boolean = false;
    private readonly guard: ActionGuard = new ActionGuard();

    constructor() {
        makeObservable(this);
    }

    init(): void {
        if (this.isMounted) return;
        this.isMounted = true;
        this.disposable.register(
            "social-friends-on-auth",
            reaction(
                () => this.auth.isAuthenticated && this.auth.isBootstrapped,
                (ready) => {
                    if (ready) {
                        void this.fetchFriendsActivity();
                        this.startPolling();
                    } else {
                        this.stopPolling();
                        runInAction(() => {
                            this.friendsActivity = [];
                        });
                    }
                },
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.stopPolling();
        this.disposable.dispose();
        this.isMounted = false;
    }

    private startPolling(): void {
        this.stopPolling();
        if (typeof window === "undefined") return;
        this.pollHandle = setInterval(() => {
            void this.fetchFriendsActivity();
        }, FRIENDS_POLL_INTERVAL_MS);
    }

    private stopPolling(): void {
        if (this.pollHandle !== null) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
    }

    async fetchFriendsActivity(): Promise<FriendListening[]> {
        if (!this.auth.isAuthenticated) return [];
        runInAction(() => {
            this.isLoadingFriends = true;
        });
        const result = await apiRequest<{ items: FriendListening[] }>("GET", "/me/friends-activity/");
        const items = result.ok && result.data ? result.data.items : [];
        runInAction(() => {
            this.friendsActivity = items;
            this.isLoadingFriends = false;
        });
        return items;
    }

    async getProfile(userId: number | string): Promise<PublicUser | null> {
        const result = await apiRequest<PublicUser>("GET", `/users/${userId}/`);
        return result.ok ? result.data : null;
    }

    async getPublicPlaylists(userId: number | string): Promise<PlaylistSummary[]> {
        const result = await apiRequest<{ items: PlaylistSummary[] }>(
            "GET",
            `/users/${userId}/playlists/`,
        );
        return result.ok && result.data ? result.data.items : [];
    }

    async getFollowers(userId: number | string): Promise<FollowEntry[]> {
        const result = await apiRequest<{ items: FollowEntry[] }>("GET", `/users/${userId}/followers/`);
        return result.ok && result.data ? result.data.items : [];
    }

    async getFollowing(userId: number | string): Promise<FollowEntry[]> {
        const result = await apiRequest<{ items: FollowEntry[] }>("GET", `/users/${userId}/following/`);
        return result.ok && result.data ? result.data.items : [];
    }

    isFollowBusy(userId: number | string): boolean {
        return this.guard.isBusy(`social:follow:${userId}`);
    }

    get isPrivacyBusy(): boolean {
        return this.guard.isBusy("social:patch-privacy");
    }

    async toggleFollow(userId: number | string, currentlyFollowing: boolean): Promise<boolean> {
        if (!this.auth.isAuthenticated) return currentlyFollowing;
        const outcome = await this.guard.run(`social:follow:${userId}`, async () => {
            const method = currentlyFollowing ? "DELETE" : "PUT";
            const result = await apiRequest<{ following: boolean }>(method, `/users/${userId}/follow/`);
            if (!result.ok) return currentlyFollowing;
            return result.data?.following ?? !currentlyFollowing;
        });
        return outcome ?? currentlyFollowing;
    }

    async getFeed(limit: number = 30): Promise<FeedEntry[]> {
        const result = await apiRequest<{ items: FeedEntry[] }>("GET", "/me/feed/", {
            params: { limit },
        });
        return result.ok && result.data ? result.data.items : [];
    }

    async getRecap(year?: number): Promise<YearlyRecap | null> {
        const params: Record<string, string | number> = {};
        if (year) params.year = year;
        const result = await apiRequest<YearlyRecap>("GET", "/me/recap/", { params });
        return result.ok ? result.data : null;
    }

    async patchPrivacy(patch: PrivacyPatch): Promise<PrivacyPatch | null> {
        return (
            (await this.guard.run("social:patch-privacy", async () => {
                const result = await apiRequest<PrivacyPatch>("PATCH", "/me/privacy/", { body: patch });
                return result.ok ? result.data : null;
            })) ?? null
        );
    }
}
