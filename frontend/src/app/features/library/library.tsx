import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { TitleService } from "@/app/core/services/browser/title.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import { LibraryPageService } from "./library.service";
import styles from "./library.module.scss";
import { AlbumsTab } from "./sections/albums-tab/albums-tab";
import { ArtistsTab } from "./sections/artists-tab/artists-tab";
import { LikedPin } from "./sections/liked-pin/liked-pin";
import { PlaylistsTab } from "./sections/playlists-tab/playlists-tab";

const TAB_KEYS = [
    { key: "playlists", labelKey: "library.tab-playlists" },
    { key: "albums", labelKey: "library.tab-albums" },
    { key: "artists", labelKey: "library.tab-artists" },
] as const;

@observer
export class Library extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private library: LibraryService = inject(LibraryService);
    private page: LibraryPageService = inject(LibraryPageService);

    componentDidMount(): void {
        this.title.construct({ title: "Library", titleNamespace: "common", titleTKey: "nav.library" });
        this.title.init();
        void this.page.initialize();
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    private renderTab(): ReactNode {
        if (this.page.activeTab === "albums") {
            return <AlbumsTab albums={this.library.savedAlbums} />;
        }
        if (this.page.activeTab === "artists") {
            return <ArtistsTab artists={this.library.followedArtists} />;
        }
        return <PlaylistsTab playlists={this.library.myPlaylists} />;
    }

    render(): ReactNode {
        if (!this.auth.isAuthenticated) {
            return (
                <div className={styles["library"]}>
                    <div className={styles["library__notice"]}>
                        <h1 className={styles["library__title"]}>
                            {this.locale.t("common", "library.title")}
                        </h1>
                        <p className={styles["library__hint"]}>
                            {this.locale.t("common", "library.signed-out-hint")}
                        </p>
                        <div className={styles["library__cta"]}>
                            <NavLink to="/login" baseClass={styles["library__cta-primary"]}>
                                {this.locale.t("common", "auth.sign-in")}
                            </NavLink>
                            <NavLink to="/register" baseClass={styles["library__cta-secondary"]}>
                                {this.locale.t("common", "auth.sign-up")}
                            </NavLink>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles["library"]}>
                <header className={styles["library__header"]}>
                    <h1 className={styles["library__title"]}>
                        {this.locale.t("common", "library.title")}
                    </h1>
                </header>

                <LikedPin total={this.library.likedTotal} />

                <nav
                    className={styles["library__tabs"]}
                    aria-label={this.locale.t("common", "library.tabs-aria")}
                >
                    {TAB_KEYS.map(({ key, labelKey }) => (
                        <button
                            key={key}
                            type="button"
                            className={className(styles["library__tab"], {
                                [styles["library__tab--active"]]: this.page.activeTab === key,
                            })}
                            onClick={() => this.page.setTab(key)}
                        >
                            {this.locale.t("common", labelKey)}
                        </button>
                    ))}
                </nav>

                <div className={styles["library__content"]}>{this.renderTab()}</div>
            </div>
        );
    }
}
