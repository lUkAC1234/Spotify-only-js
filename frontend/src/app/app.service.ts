import { AuthService } from "./core/services/auth/auth.service";
import { DisposableService } from "./core/services/disposable-stack.service";
import { KeyboardShortcutsService } from "./core/services/player/keyboard-shortcuts.service";
import { MediaSessionService } from "./core/services/player/media-session.service";
import { PlayerService } from "./core/services/player/player.service";
import { PlayerSyncService } from "./core/services/player/player-sync.service";
import { inject, injectable } from "./shared/decorators/di";
import { setupInterceptors } from "./shared/utils/functions/interceptors";

@injectable()
export class AppService {
    disposable: DisposableService = inject(DisposableService);
    auth: AuthService = inject(AuthService);
    player: PlayerService = inject(PlayerService);
    keyboardShortcuts: KeyboardShortcutsService = inject(KeyboardShortcutsService);
    mediaSession: MediaSessionService = inject(MediaSessionService);
    playerSync: PlayerSyncService = inject(PlayerSyncService);

    init(): void {
        setupInterceptors([]);
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
