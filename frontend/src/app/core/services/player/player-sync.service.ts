import { reaction, runInAction } from "mobx";

import { config } from "@/app/app.config";
import { AuthService } from "@/app/core/services/auth/auth.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { PlayerService, RepeatMode } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";
import { Log } from "@/app/shared/utils/functions/logger";

import { apiRequest } from "../http/api-client";

interface PlaybackStatePayload {
    track: Track | null;
    positionMs: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    repeatMode: RepeatMode;
    shuffleEnabled: boolean;
    queueTrackIds: number[];
    historyTrackIds: number[];
    contextType: string;
    contextId: string;
    updatedAt: string;
}

const REPEAT_MODES: ReadonlyArray<RepeatMode> = ["off", "all", "one"];

const isRepeatMode = (value: string): value is RepeatMode => REPEAT_MODES.includes(value as RepeatMode);

@injectable()
export class PlayerSyncService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly player: PlayerService = inject(PlayerService);
    private readonly disposable: DisposableService = inject(DisposableService);

    private isMounted: boolean = false;
    private isHydrating: boolean = false;
    private hasHydrated: boolean = false;
    private lastSyncedKey: string = "";

    private readonly pushDebounced = debounce(() => {
        void this.pushNow();
    }, config.PLAYER_SYNC_DEBOUNCE_MS);

    private readonly playEventDebounced = debounce(() => {
        void this.recordPlayEvent();
    }, 30_000);

    init(): void {
        if (this.isMounted) return;
        this.isMounted = true;

        this.disposable.register(
            "player-sync-on-auth",
            reaction(
                () => this.auth.isAuthenticated && this.auth.isBootstrapped,
                (ready) => {
                    if (ready) {
                        if (this.isHydrating || this.hasHydrated) return;
                        void this.hydrate();
                    } else {
                        this.lastSyncedKey = "";
                        this.hasHydrated = false;
                    }
                },
                { fireImmediately: true },
            ),
        );

        this.disposable.register(
            "player-sync-on-state",
            reaction(
                () => this.snapshotKey(),
                () => {
                    if (!this.auth.isAuthenticated || this.isHydrating) return;
                    this.pushDebounced();
                },
            ),
        );

        this.disposable.register(
            "player-sync-position",
            reaction(
                () => this.player.positionMs,
                () => {
                    if (!this.auth.isAuthenticated || !this.player.currentTrack) return;
                    this.playEventDebounced();
                },
            ),
        );
    }

    dispose(): void {
        this.pushDebounced.cancel();
        this.playEventDebounced.cancel();
        this.disposable.dispose();
        this.isMounted = false;
    }

    private snapshotKey(): string {
        const trackId = this.player.currentTrack?.id ?? 0;
        const queueIds = this.player.queue.map((t) => t.id).join(",");
        const historyIds = this.player.history.map((t) => t.id).join(",");
        return [
            trackId,
            this.player.isPlaying ? "p" : "s",
            this.player.repeatMode,
            this.player.shuffleEnabled ? "sh" : "no",
            this.player.volume.toFixed(2),
            this.player.isMuted ? "m" : "u",
            queueIds,
            historyIds,
            this.player.context?.type ?? "",
            String(this.player.context?.id ?? ""),
        ].join("|");
    }

    private async hydrate(): Promise<void> {
        if (this.isHydrating) return;
        this.isHydrating = true;
        try {
            const result = await apiRequest<PlaybackStatePayload>("GET", "/playback/state/");
            if (!result.ok || !result.data) return;
            this.applyPayload(result.data);
            this.lastSyncedKey = this.snapshotKey();
            this.hasHydrated = true;
        } catch (err) {
            Log.APIError(`[player-sync] hydrate failed: ${(err as Error).message}`);
        } finally {
            this.isHydrating = false;
        }
    }

    private applyPayload(payload: PlaybackStatePayload): void {
        runInAction(() => {
            if (payload.repeatMode && isRepeatMode(payload.repeatMode)) {
                this.player.setRepeatMode(payload.repeatMode);
            }
            this.player.setShuffleEnabled(!!payload.shuffleEnabled);
            if (typeof payload.volume === "number") {
                this.player.setVolume(payload.volume);
            }
            if (typeof payload.isMuted === "boolean") {
                this.player.setMuted(payload.isMuted);
            }
            if (payload.track) {
                this.player.hydrateTrack(payload.track, payload.positionMs ?? 0);
            }
        });
    }

    private async pushNow(): Promise<void> {
        if (!this.auth.isAuthenticated) return;
        const key = this.snapshotKey();
        if (key === this.lastSyncedKey) return;
        this.lastSyncedKey = key;

        const body = {
            trackId: this.player.currentTrack?.id ?? null,
            positionMs: Math.round(this.player.positionMs),
            isPlaying: this.player.isPlaying,
            volume: this.player.volume,
            isMuted: this.player.isMuted,
            repeatMode: this.player.repeatMode,
            shuffleEnabled: this.player.shuffleEnabled,
            queueTrackIds: this.player.queue.map((t) => t.id),
            historyTrackIds: this.player.history.map((t) => t.id),
            contextType: this.player.context?.type ?? "",
            contextId: String(this.player.context?.id ?? ""),
        };

        const result = await apiRequest("POST", "/playback/state/", { body });
        if (!result.ok) {
            Log.APIError(`[player-sync] push failed: ${result.error?.message ?? "unknown"}`);
        }
    }

    private async recordPlayEvent(): Promise<void> {
        if (!this.auth.isAuthenticated) return;
        const track = this.player.currentTrack;
        if (!track) return;
        const ms = Math.round(this.player.positionMs);
        if (ms < 30_000) return;
        const result = await apiRequest("POST", "/playback/play-event/", {
            body: {
                trackId: track.id,
                msListened: ms,
                source: this.player.context?.type ?? "track",
            },
        });
        if (!result.ok) {
            Log.APIError(`[player-sync] play-event failed: ${result.error?.message ?? "unknown"}`);
        }
    }
}
