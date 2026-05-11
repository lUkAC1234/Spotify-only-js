import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { LayoutService } from "@/app/core/services/ui/layout.service";
import { className } from "@/app/shared/utils/functions/className";
import { inject } from "@/app/shared/decorators/di";
import { CreatePlaylistModalService } from "@/app/shared/ui/create-playlist-modal/create-playlist-modal.service";
import { FriendsPanelService } from "@/app/shared/ui/friends-rail/friends-panel.service";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_ChevronRight } from "@/app/shared/ui/svg/nav/svg-chevron-right";
import { SVG_Friends } from "@/app/shared/ui/svg/nav/svg-friends";
import { SVG_MusicNote } from "@/app/shared/ui/svg/nav/svg-music-note";
import { SVG_Plus } from "@/app/shared/ui/svg/nav/svg-plus";
import { SVG_SpotifyBadge } from "@/app/shared/ui/svg/nav/svg-spotify-badge";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";

import styles from "./sidebar.module.scss";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarGuestCards } from "./sidebar-guest-cards";

@observer
export class Sidebar extends Component {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private library: LibraryService = inject(LibraryService);
    private layout: LayoutService = inject(LayoutService);
    private createModal: CreatePlaylistModalService = inject(CreatePlaylistModalService);
    private friendsPanel: FriendsPanelService = inject(FriendsPanelService);

    private handleCreate = (): void => {
        if (!this.auth.isAuthenticated) return;
        this.createModal.open();
    };

    private handleFriendsActivity = (): void => {
        this.friendsPanel.open();
        if (this.layout.sidebarIsActive) {
            this.layout.closeSidebar();
        }
    };

    private handleToggleCollapsed = (): void => {
        this.layout.toggleSidebarCollapsed();
    };

    private renderAuthedBody(): ReactNode {
        const playlists = this.library.myPlaylists;
        const friendsLabel = this.locale.t("common", "social.friend-activity");
        return (
            <>
                <button
                    type="button"
                    className={className(`${styles["sidebar__row"]} ${styles["sidebar__row--button"]}`, {
                        [styles["sidebar__row--active"]]: this.friendsPanel.isOpen,
                    })}
                    onClick={this.handleFriendsActivity}
                    aria-label={friendsLabel}
                    aria-pressed={this.friendsPanel.isOpen}
                    title={friendsLabel}
                >
                    <span className={styles["sidebar__icon-cover"]} aria-hidden="true">
                        <SVG_Friends className={styles["sidebar__icon-glyph"]} />
                    </span>
                    <span className={styles["sidebar__row-meta"]}>
                        <span className={styles["sidebar__row-title"]}>{friendsLabel}</span>
                    </span>
                </button>
                <NavLink
                    to="/library/liked"
                    baseClass={styles["sidebar__row"]}
                    activeClass={styles["sidebar__row--active"]}
                    title={this.locale.t("common", "library.liked-songs")}
                >
                    <span className={styles["sidebar__liked-cover"]} aria-hidden="true">
                        <SVG_HeartFilled className={styles["sidebar__liked-icon"]} />
                    </span>
                    <span className={styles["sidebar__row-meta"]}>
                        <span className={styles["sidebar__row-title"]}>
                            {this.locale.t("common", "library.liked-songs")}
                        </span>
                        <span className={styles["sidebar__row-sub"]}>
                            {this.locale.t("common", "playlist.label")}
                        </span>
                    </span>
                </NavLink>
                {playlists.length > 0 && (
                    <ul className={styles["sidebar__playlists"]}>
                        {playlists.map((playlist) => (
                            <li key={playlist.id} className={styles["sidebar__playlist-item"]}>
                                <NavLink
                                    to={`/playlist/${playlist.id}`}
                                    baseClass={styles["sidebar__row"]}
                                    activeClass={styles["sidebar__row--active"]}
                                    title={playlist.title}
                                >
                                    <span className={styles["sidebar__playlist-cover"]} aria-hidden="true">
                                        {playlist.cover ? (
                                            <img
                                                src={playlist.cover}
                                                alt=""
                                                loading="lazy"
                                                className={styles["sidebar__playlist-img"]}
                                            />
                                        ) : (
                                            <SVG_MusicNote className={styles["sidebar__playlist-placeholder"]} />
                                        )}
                                    </span>
                                    <span className={styles["sidebar__row-meta"]}>
                                        <span className={styles["sidebar__row-title"]}>{playlist.title}</span>
                                        <span className={styles["sidebar__row-sub"]}>
                                            {this.locale.t("common", "playlist.label")}
                                        </span>
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </>
        );
    }

    render(): ReactNode {
        const canCreate = this.auth.isAuthenticated;
        const isCollapsed = this.layout.sidebarIsCollapsed;
        const toggleLabel = isCollapsed
            ? this.locale.t("common", "sidebar.expand")
            : this.locale.t("common", "sidebar.collapse");

        return (
            <nav
                className={styles["sidebar"]}
                aria-label={this.locale.t("common", "nav.primary")}
                data-collapsed={isCollapsed ? "true" : "false"}
            >
                <NavLink
                    to="/"
                    end
                    baseClass={styles["sidebar__brand"]}
                    aria-label={this.locale.t("common", "topnav.brand-aria")}
                >
                    <SVG_SpotifyBadge className={styles["sidebar__brand-logo"]} />
                    <span className={styles["sidebar__brand-name"]}>
                        {this.locale.t("common", "app.name")}
                    </span>
                </NavLink>

                <header className={styles["sidebar__header"]}>
                    <span className={styles["sidebar__title"]}>
                        {this.locale.t("common", "sidebar.library-title")}
                    </span>
                    <button
                        type="button"
                        className={styles["sidebar__create"]}
                        onClick={this.handleCreate}
                        disabled={!canCreate}
                        aria-disabled={!canCreate}
                        aria-label={this.locale.t("common", "sidebar.create-aria")}
                        title={
                            canCreate
                                ? this.locale.t("common", "playlist.create")
                                : this.locale.t("common", "playlist.create-disabled")
                        }
                    >
                        <SVG_Plus className={styles["sidebar__create-icon"]} />
                        <span className={styles["sidebar__create-label"]}>
                            {this.locale.t("common", "playlist.create-cta")}
                        </span>
                    </button>
                </header>

                <div className={styles["sidebar__divider"]} aria-hidden="true" />

                <div className={styles["sidebar__body"]}>
                    {canCreate ? this.renderAuthedBody() : <SidebarGuestCards />}
                </div>

                <button
                    type="button"
                    className={className(styles["sidebar__collapse-toggle"], {
                        [styles["sidebar__collapse-toggle--collapsed"]]: isCollapsed,
                    })}
                    onClick={this.handleToggleCollapsed}
                    aria-label={toggleLabel}
                    aria-pressed={isCollapsed}
                    title={toggleLabel}
                >
                    <SVG_ChevronRight className={styles["sidebar__collapse-icon"]} />
                </button>

                <SidebarFooter />
            </nav>
        );
    }
}
