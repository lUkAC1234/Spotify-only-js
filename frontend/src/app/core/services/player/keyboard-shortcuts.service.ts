import { PlayerService } from "@/app/core/services/player/player.service";
import { inject, injectable } from "@/app/shared/decorators/di";

const SEEK_STEP_MS = 10_000;
const VOLUME_STEP = 0.05;

const isEditable = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    return false;
};

@injectable()
export class KeyboardShortcutsService {
    private readonly player: PlayerService = inject(PlayerService);
    private isMounted: boolean = false;

    init(): void {
        if (this.isMounted || typeof window === "undefined") return;
        this.isMounted = true;
        window.addEventListener("keydown", this.handleKeydown);
    }

    dispose(): void {
        if (!this.isMounted || typeof window === "undefined") return;
        window.removeEventListener("keydown", this.handleKeydown);
        this.isMounted = false;
    }

    private handleKeydown = (event: KeyboardEvent): void => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (isEditable(event.target)) return;

        switch (event.code) {
            case "Space": {
                if (!this.player.hasTrack) return;
                event.preventDefault();
                this.player.togglePlay();
                return;
            }
            case "KeyM": {
                if (!this.player.hasTrack) return;
                event.preventDefault();
                this.player.toggleMute();
                return;
            }
            case "ArrowLeft": {
                if (!this.player.hasTrack) return;
                event.preventDefault();
                if (event.shiftKey) {
                    this.player.prev();
                } else {
                    this.player.seek(this.player.positionMs - SEEK_STEP_MS);
                }
                return;
            }
            case "ArrowRight": {
                if (!this.player.hasTrack) return;
                event.preventDefault();
                if (event.shiftKey) {
                    this.player.next();
                } else {
                    this.player.seek(this.player.positionMs + SEEK_STEP_MS);
                }
                return;
            }
            case "ArrowUp": {
                event.preventDefault();
                this.player.setVolume(this.player.volume + VOLUME_STEP);
                return;
            }
            case "ArrowDown": {
                event.preventDefault();
                this.player.setVolume(this.player.volume - VOLUME_STEP);
                return;
            }
            case "KeyS": {
                if (event.shiftKey) {
                    event.preventDefault();
                    this.player.toggleShuffle();
                }
                return;
            }
            case "KeyR": {
                if (event.shiftKey) {
                    event.preventDefault();
                    this.player.cycleRepeat();
                }
                return;
            }
            default:
                return;
        }
    };
}
