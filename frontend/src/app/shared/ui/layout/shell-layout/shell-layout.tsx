import { observer } from "mobx-react";
import { Component, ReactNode, RefObject, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";

import { LocaleService } from "@/app/core/services/locale.service";
import { SUPPORTED_LANGS } from "@/app/core/services/locale-utils";
import { PlayerService } from "@/app/core/services/player/player.service";
import { LayoutService } from "@/app/core/services/ui/layout.service";
import { inject } from "@/app/shared/decorators/di";
import { _static } from "@/app/shared/decorators/static";
import { BottomPlayer } from "@/app/shared/ui/bottom-player/bottom-player";
import { CreatePlaylistModal } from "@/app/shared/ui/create-playlist-modal/create-playlist-modal";
import { FriendsRail } from "@/app/shared/ui/friends-rail/friends-rail";
import { MarketingBanner } from "@/app/shared/ui/marketing-banner/marketing-banner";
import { QueuePanel } from "@/app/shared/ui/queue-panel/queue-panel";
import { Sidebar } from "@/app/shared/ui/sidebar/sidebar";
import { TopNav } from "@/app/shared/ui/top-nav/top-nav";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./shell-layout.module.scss";

const stripLangPrefix = (pathname: string): string => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0 && SUPPORTED_LANGS.includes(parts[0])) {
        return "/" + parts.slice(1).join("/");
    }
    return "/" + parts.join("/");
};

interface BodyProps {
    mainRef: RefObject<HTMLElement | null>;
}

@observer
class ShellLayoutBody extends Component<BodyProps> {
    private layout: LayoutService = inject(LayoutService);
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    render(): ReactNode {
        const drawerOpen = this.layout.sidebarIsActive;
        const playerActive = this.player.currentTrack !== null;
        const sidebarCollapsed = this.layout.sidebarIsCollapsed;
        return (
            <div
                className={className(styles["shell"], {
                    [styles["shell--drawer-open"]]: drawerOpen,
                    [styles["shell--player-hidden"]]: !playerActive,
                    [styles["shell--sidebar-collapsed"]]: sidebarCollapsed,
                })}
                data-player-active={playerActive}
            >
                <aside
                    className={className(styles["shell__sidebar"], {
                        [styles["shell__sidebar--open"]]: drawerOpen,
                    })}
                >
                    <Sidebar />
                </aside>
                <button
                    type="button"
                    className={className(styles["shell__backdrop"], {
                        [styles["shell__backdrop--visible"]]: drawerOpen,
                    })}
                    onClick={this.layout.closeSidebar}
                    aria-hidden={!drawerOpen}
                    tabIndex={drawerOpen ? 0 : -1}
                    aria-label={this.locale.t("common", "nav.close-menu")}
                />
                <header className={styles["shell__topnav"]}>
                    <TopNav />
                </header>
                <main className={styles["shell__main"]} ref={this.props.mainRef}>
                    <Outlet />
                </main>
                <div className={styles["shell__banner"]}>
                    <MarketingBanner />
                </div>
                <footer
                    className={styles["shell__player"]}
                    aria-hidden={!playerActive}
                >
                    <BottomPlayer />
                </footer>
                <FriendsRail />
                <QueuePanel />
                <CreatePlaylistModal />
            </div>
        );
    }
}

const ShellLayoutWithLocation = (): ReactNode => {
    const location = useLocation();
    const layout = inject(LayoutService);
    const mainRef = useRef<HTMLElement | null>(null);
    const previousCleanPathRef = useRef<string>(stripLangPrefix(location.pathname));

    useEffect(() => {
        layout.closeSidebar();
        const cleanPath = stripLangPrefix(location.pathname);
        if (previousCleanPathRef.current === cleanPath) return;
        previousCleanPathRef.current = cleanPath;
        const node = mainRef.current;
        if (node) {
            node.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
    }, [layout, location.pathname]);

    return <ShellLayoutBody mainRef={mainRef} />;
};

@_static
export class ShellLayout extends Component {
    render(): ReactNode {
        return <ShellLayoutWithLocation />;
    }
}
