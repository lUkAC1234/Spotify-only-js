import { action, computed, makeObservable, observable, reaction } from "mobx";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { PlaybackContext, Track } from "@/app/core/types/track";
import { inject, injectable } from "@/app/shared/decorators/di";
import { Log } from "@/app/shared/utils/functions/logger";

export type RepeatMode = "off" | "one" | "all";

@injectable()
export class PlayerService {
    private readonly catalog: CatalogService = inject(CatalogService);
    private readonly disposable: DisposableService = inject(DisposableService);

    private audio: HTMLAudioElement | null = null;
    private isInitialized: boolean = false;

    @observable currentTrack: Track | null = null;
    @observable queue: Track[] = [];
    @observable history: Track[] = [];
    @observable context: PlaybackContext | null = null;
    @observable isPlaying: boolean = false;
    @observable isBuffering: boolean = false;
    @observable positionMs: number = 0;
    @observable durationMs: number = 0;
    @observable volume: number = 0.8;
    @observable isMuted: boolean = false;
    @observable repeatMode: RepeatMode = "off";
    @observable shuffleEnabled: boolean = false;
    @observable isQueueOpen: boolean = false;

    constructor() {
        makeObservable(this);
    }

    init(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (typeof window === "undefined") return;

        this.audio = new Audio();
        this.audio.preload = "metadata";
        this.audio.volume = this.volume;

        const audio = this.audio;
        audio.addEventListener("loadedmetadata", this.handleMetadata);
        audio.addEventListener("timeupdate", this.handleTimeUpdate);
        audio.addEventListener("waiting", this.handleWaiting);
        audio.addEventListener("playing", this.handlePlaying);
        audio.addEventListener("ended", this.handleEnded);
        audio.addEventListener("error", this.handleError);

        this.disposable.register(
            "player-volume-sync",
            reaction(
                () => ({ volume: this.volume, muted: this.isMuted }),
                ({ volume, muted }) => {
                    if (!this.audio) return;
                    this.audio.volume = volume;
                    this.audio.muted = muted;
                },
            ),
        );
    }

    dispose(): void {
        if (this.audio) {
            this.audio.removeEventListener("loadedmetadata", this.handleMetadata);
            this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
            this.audio.removeEventListener("waiting", this.handleWaiting);
            this.audio.removeEventListener("playing", this.handlePlaying);
            this.audio.removeEventListener("ended", this.handleEnded);
            this.audio.removeEventListener("error", this.handleError);
            this.audio.pause();
            this.audio.src = "";
            this.audio = null;
        }
        this.disposable.dispose();
        this.isInitialized = false;
    }

    @computed
    get hasTrack(): boolean {
        return this.currentTrack !== null;
    }

    @computed
    get progress(): number {
        if (!this.durationMs) return 0;
        return Math.min(1, this.positionMs / this.durationMs);
    }

    @action.bound
    playTrack(track: Track, context: PlaybackContext | null = null): void {
        this.currentTrack = track;
        this.context = context;
        this.durationMs = track.durationMs;
        this.positionMs = 0;
        this.isPlaying = true;
        this.isBuffering = true;
        this.loadAndPlay(track);
    }

    @action.bound
    setQueue(tracks: Track[]): void {
        this.queue = tracks;
    }

    @action.bound
    play(): void {
        if (!this.currentTrack || !this.audio) return;
        this.isPlaying = true;
        this.audio.play().catch((err) => Log.APIError(`[player] play failed: ${err.message}`));
    }

    @action.bound
    pause(): void {
        this.isPlaying = false;
        this.audio?.pause();
    }

    @action.bound
    togglePlay(): void {
        if (!this.currentTrack) return;
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    @action.bound
    next(): void {
        if (this.repeatMode === "one" && this.currentTrack && this.audio) {
            this.audio.currentTime = 0;
            this.positionMs = 0;
            this.audio.play().catch(() => {});
            return;
        }

        const [head, ...rest] = this.queue;
        if (this.currentTrack) {
            this.history = [this.currentTrack, ...this.history].slice(0, 64);
        }
        if (head) {
            this.queue = rest;
            this.playTrack(head, this.context);
            return;
        }

        if (this.repeatMode === "all" && this.history.length > 0) {
            const replay = [...this.history].reverse();
            this.history = [];
            this.queue = replay.slice(1);
            this.playTrack(replay[0], this.context);
            return;
        }

        this.stopAndClear();
    }

    @action.bound
    prev(): void {
        if (this.positionMs > 3000 && this.audio) {
            this.audio.currentTime = 0;
            this.positionMs = 0;
            return;
        }
        const [prev, ...rest] = this.history;
        if (!prev) {
            if (this.audio) this.audio.currentTime = 0;
            this.positionMs = 0;
            return;
        }
        if (this.currentTrack) {
            this.queue = [this.currentTrack, ...this.queue];
        }
        this.history = rest;
        this.playTrack(prev, this.context);
    }

    @action.bound
    seek(positionMs: number): void {
        this.positionMs = Math.max(0, Math.min(this.durationMs, positionMs));
        if (this.audio) this.audio.currentTime = this.positionMs / 1000;
    }

    @action.bound
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.volume > 0) this.isMuted = false;
    }

    @action.bound
    toggleMute(): void {
        this.isMuted = !this.isMuted;
    }

    @action.bound
    toggleShuffle(): void {
        this.shuffleEnabled = !this.shuffleEnabled;
        if (this.shuffleEnabled) {
            this.queue = this.shuffleArray(this.queue);
        }
    }

    @action.bound
    cycleRepeat(): void {
        const order: RepeatMode[] = ["off", "all", "one"];
        const next = order[(order.indexOf(this.repeatMode) + 1) % order.length];
        this.repeatMode = next;
    }

    @action.bound
    addToQueue(track: Track): void {
        this.queue = [...this.queue, track];
    }

    @action.bound
    playNext(track: Track): void {
        this.queue = [track, ...this.queue];
    }

    @action.bound
    removeFromQueue(index: number): void {
        if (index < 0 || index >= this.queue.length) return;
        this.queue = this.queue.filter((_, i) => i !== index);
    }

    @action.bound
    moveInQueue(from: number, to: number): void {
        if (from === to || from < 0 || to < 0) return;
        if (from >= this.queue.length || to >= this.queue.length) return;
        const next = [...this.queue];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        this.queue = next;
    }

    @action.bound
    clearQueue(): void {
        this.queue = [];
    }

    @action.bound
    toggleQueue(): void {
        this.isQueueOpen = !this.isQueueOpen;
    }

    @action.bound
    closeQueue(): void {
        this.isQueueOpen = false;
    }

    @action.bound
    private stopAndClear(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = "";
        }
        this.currentTrack = null;
        this.isPlaying = false;
        this.isBuffering = false;
        this.positionMs = 0;
        this.durationMs = 0;
    }

    private loadAndPlay(track: Track): void {
        if (!this.audio) {
            this.init();
            if (!this.audio) return;
        }
        const url = this.catalog.streamUrl(track.id);
        this.audio.src = url;
        this.audio.currentTime = 0;
        this.audio.play().catch((err) => Log.APIError(`[player] play failed: ${err.message}`));
    }

    private shuffleArray(items: Track[]): Track[] {
        const next = [...items];
        for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
    }

    private handleMetadata = (): void => {
        if (!this.audio) return;
        const seconds = this.audio.duration;
        if (Number.isFinite(seconds) && seconds > 0) {
            const ms = Math.round(seconds * 1000);
            this.applyDuration(ms);
        }
    };

    private handleTimeUpdate = (): void => {
        if (!this.audio) return;
        const current = Math.round(this.audio.currentTime * 1000);
        this.applyPosition(current);
    };

    private handleWaiting = (): void => {
        this.applyBuffering(true);
    };

    private handlePlaying = (): void => {
        this.applyBuffering(false);
        this.applyPlaying(true);
    };

    private handleEnded = (): void => {
        this.next();
    };

    private handleError = (): void => {
        Log.APIError("[player] audio element error");
        this.applyBuffering(false);
        this.applyPlaying(false);
    };

    @action.bound
    private applyDuration(value: number): void {
        this.durationMs = value;
    }

    @action.bound
    private applyPosition(value: number): void {
        this.positionMs = value;
    }

    @action.bound
    private applyBuffering(value: boolean): void {
        this.isBuffering = value;
    }

    @action.bound
    private applyPlaying(value: boolean): void {
        this.isPlaying = value;
    }
}
