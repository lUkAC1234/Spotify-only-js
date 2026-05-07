import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode } from "react";

import { config } from "@/app/app.config";
import { AuthService } from "@/app/core/services/auth/auth.service";
import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { LayoutService } from "@/app/core/services/ui/layout.service";
import { inject } from "@/app/shared/decorators/di";
import { FriendsPanelService } from "@/app/shared/ui/friends-rail/friends-panel.service";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { ProfileMenu } from "@/app/shared/ui/profile-menu/profile-menu";
import { SVG_Friends } from "@/app/shared/ui/svg/nav/svg-friends";
import { SVG_GridBrowse } from "@/app/shared/ui/svg/nav/svg-grid-browse";
import { SVG_Home } from "@/app/shared/ui/svg/nav/svg-home";
import { SVG_Search } from "@/app/shared/ui/svg/nav/svg-search";

import styles from "./top-nav.module.scss";

@observer
export class TopNav extends Component {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);
    private catalog: CatalogService = inject(CatalogService);
    private auth: AuthService = inject(AuthService);
    private layout: LayoutService = inject(LayoutService);
    private friendsPanel: FriendsPanelService = inject(FriendsPanelService);

    private handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
        this.catalog.setQuery(event.target.value);
    };

    private handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const trimmed: string = this.catalog.lastQuery.trim();
        if (!trimmed) return;
        this.navigate.navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    private renderGuestActions(): ReactNode {
        return (
            <div className={styles["topnav__guest"]}>
                <NavLink to="/register" baseClass={styles["topnav__signup"]}>
                    {this.locale.t("common", "auth.sign-up")}
                </NavLink>
                <NavLink to="/login" baseClass={styles["topnav__signin"]}>
                    {this.locale.t("common", "auth.sign-in")}
                </NavLink>
            </div>
        );
    }

    render(): ReactNode {
        const placeholder: string = this.locale.t("common", "search.placeholder");
        const ariaLabel: string = this.locale.t("common", "search.aria-label");
        const isAuthed: boolean = this.auth.isAuthenticated && this.auth.me !== null;

        return (
            <div className={styles["topnav"]}>
                <button
                    type="button"
                    className={styles["topnav__menu-btn"]}
                    onClick={this.layout.toggleSidebar}
                    aria-label={this.locale.t("common", "nav.menu")}
                    aria-expanded={this.layout.sidebarIsActive}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="17" x2="20" y2="17" />
                    </svg>
                </button>

                <div className={styles["topnav__left"]}>
                    <NavLink
                        to="/"
                        baseClass={styles["topnav__home"]}
                        activeClass={styles["topnav__home--active"]}
                        end
                        aria-label={this.locale.t("common", "topnav.home-aria")}
                    >
                        <SVG_Home />
                    </NavLink>
                </div>

                <form className={styles["topnav__search"]} onSubmit={this.handleSubmit} role="search">
                    <SVG_Search className={styles["topnav__search-icon"]} />
                    <input
                        type="search"
                        className={styles["topnav__search-input"]}
                        value={this.catalog.lastQuery}
                        onChange={this.handleQueryChange}
                        placeholder={placeholder}
                        aria-label={ariaLabel}
                        maxLength={120}
                        autoComplete="off"
                        spellCheck={false}
                        data-debounce-ms={config.SEARCH_DEBOUNCE_MS}
                    />
                    <NavLink
                        to="/search"
                        baseClass={styles["topnav__search-browse"]}
                        aria-label={this.locale.t("common", "topnav.browse-aria")}
                    >
                        <SVG_GridBrowse />
                    </NavLink>
                </form>

                <div className={styles["topnav__right"]}>
                    {isAuthed && (
                        <button
                            type="button"
                            className={styles["topnav__friends-btn"]}
                            onClick={this.friendsPanel.toggle}
                            aria-label={this.locale.t("common", "social.friend-activity")}
                            aria-expanded={this.friendsPanel.isOpen}
                            aria-pressed={this.friendsPanel.isOpen}
                        >
                            <SVG_Friends />
                        </button>
                    )}
                    {isAuthed ? <ProfileMenu /> : this.renderGuestActions()}
                </div>
            </div>
        );
    }
}
