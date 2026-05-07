import { AuthService } from "./core/services/auth/auth.service";
import { DisposableService } from "./core/services/disposable-stack.service";
import { LibraryService } from "./core/services/library/library.service";
import { KeyboardShortcutsService } from "./core/services/player/keyboard-shortcuts.service";
import { MediaSessionService } from "./core/services/player/media-session.service";
import { PlayerService } from "./core/services/player/player.service";
import { PlayerSyncService } from "./core/services/player/player-sync.service";
import { SocialService } from "./core/services/social/social.service";
import { LayoutService } from "./core/services/ui/layout.service";
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
    library: LibraryService = inject(LibraryService);
    social: SocialService = inject(SocialService);
    layout: LayoutService = inject(LayoutService);

    init(): void {
        setupInterceptors([]);
        this.layout.init();
        this.player.init();
        this.keyboardShortcuts.init();
        this.mediaSession.init();
        this.playerSync.init();
        this.library.init();
        this.social.init();
    }

    dispose(): void {
        this.social.dispose();
        this.library.dispose();
        this.playerSync.dispose();
        this.mediaSession.dispose();
        this.keyboardShortcuts.dispose();
        this.player.dispose();
        this.layout.dispose();
        this.disposable.dispose();
    }
}
