import { reaction } from "mobx";

import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";

const ARTWORK_SIZES: ReadonlyArray<{ size: string; type: string }> = [
    { size: "96x96", type: "image/png" },
    { size: "192x192", type: "image/png" },
    { size: "512x512", type: "image/png" },
];

const buildArtwork = (track: Track | null): MediaImage[] => {
    const cover = track?.cover || track?.album?.cover || "";
    if (!cover) return [];
    return ARTWORK_SIZES.map(({ size, type }) => ({ src: cover, sizes: size, type }));
};

@injectable()
export class MediaSessionService {
    private readonly player: PlayerService = inject(PlayerService);
    private readonly disposable: DisposableService = inject(DisposableService);
    private isMounted: boolean = false;

    init(): void {
        if (this.isMounted) return;
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
        this.isMounted = true;

        this.bindActionHandlers();

        this.disposable.register(
            "media-session-metadata",
            reaction(
                () => this.player.currentTrack,
                (track) => this.applyMetadata(track),
                { fireImmediately: true },
            ),
        );

        this.disposable.register(
            "media-session-state",
            reaction(
                () => ({
                    playing: this.player.isPlaying,
                    hasTrack: this.player.hasTrack,
                }),
                ({ playing, hasTrack }) => {
                    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
                    navigator.mediaSession.playbackState = !hasTrack
                        ? "none"
                        : playing
                          ? "playing"
                          : "paused";
                },
                { fireImmediately: true },
            ),
        );

        this.disposable.register(
            "media-session-position",
            reaction(
                () => ({
                    durationMs: this.player.durationMs,
                    positionMs: this.player.positionMs,
                }),
                ({ durationMs, positionMs }) => {
                    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
                    if (typeof navigator.mediaSession.setPositionState !== "function") return;
                    if (durationMs <= 0) return;
                    try {
                        navigator.mediaSession.setPositionState({
                            duration: durationMs / 1000,
                            position: Math.min(positionMs, durationMs) / 1000,
                            playbackRate: 1,
                        });
                    } catch {
                        // Some browsers throw if values are out of range — ignore
                    }
                },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
        this.isMounted = false;
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
    }

    private applyMetadata(track: Track | null): void {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
        if (!track) {
            navigator.mediaSession.metadata = null;
            return;
        }
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist?.name ?? "",
            album: track.album?.title ?? "",
            artwork: buildArtwork(track),
        });
    }

    private bindActionHandlers(): void {
        const session = navigator.mediaSession;
        try {
            session.setActionHandler("play", () => this.player.play());
            session.setActionHandler("pause", () => this.player.pause());
            session.setActionHandler("previoustrack", () => this.player.prev());
            session.setActionHandler("nexttrack", () => this.player.next());
            session.setActionHandler("seekbackward", (details) => {
                const offset = ((details.seekOffset ?? 10) as number) * 1000;
                this.player.seek(this.player.positionMs - offset);
            });
            session.setActionHandler("seekforward", (details) => {
                const offset = ((details.seekOffset ?? 10) as number) * 1000;
                this.player.seek(this.player.positionMs + offset);
            });
            session.setActionHandler("seekto", (details) => {
                if (typeof details.seekTime !== "number") return;
                this.player.seek(details.seekTime * 1000);
            });
            session.setActionHandler("stop", () => this.player.pause());
        } catch {
            // Some browsers don't support all actions — non-fatal
        }
    }
}
