import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { CreatePlaylistModalService } from "@/app/shared/ui/create-playlist-modal/create-playlist-modal.service";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_Plus } from "@/app/shared/ui/svg/nav/svg-plus";
import { SVG_SpotifyBadge } from "@/app/shared/ui/svg/nav/svg-spotify-badge";

import styles from "./sidebar.module.scss";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarGuestCards } from "./sidebar-guest-cards";

@observer
export class Sidebar extends Component {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private library: LibraryService = inject(LibraryService);
    private createModal: CreatePlaylistModalService = inject(CreatePlaylistModalService);

    private handleCreate = (): void => {
        if (!this.auth.isAuthenticated) return;
        this.createModal.open();
    };

    private renderAuthedBody(): ReactNode {
        const playlists = this.library.myPlaylists;
        return (
            <>
                <NavLink
                    to="/library/liked"
                    baseClass={styles["sidebar__liked"]}
                    activeClass={styles["sidebar__liked--active"]}
                >
                    <span className={styles["sidebar__liked-cover"]} aria-hidden="true" />
                    <div className={styles["sidebar__liked-meta"]}>
                        <span className={styles["sidebar__liked-title"]}>
                            {this.locale.t("common", "library.liked-songs")}
                        </span>
                        <span className={styles["sidebar__liked-sub"]}>
                            {this.locale.t("common", "playlist.label")}
                        </span>
                    </div>
                </NavLink>
                {playlists.length > 0 && (
                    <ul className={styles["sidebar__playlists"]}>
                        {playlists.map((playlist) => (
                            <li key={playlist.id} className={styles["sidebar__playlist-item"]}>
                                <NavLink
                                    to={`/playlist/${playlist.id}`}
                                    baseClass={styles["sidebar__playlist"]}
                                    activeClass={styles["sidebar__playlist--active"]}
                                >
                                    <span className={styles["sidebar__playlist-title"]}>
                                        {playlist.title}
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

        return (
            <nav className={styles["sidebar"]} aria-label={this.locale.t("common", "nav.primary")}>
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

                <div className={styles["sidebar__body"]}>
                    {canCreate ? this.renderAuthedBody() : <SidebarGuestCards />}
                </div>

                <SidebarFooter />
            </nav>
        );
    }
}
