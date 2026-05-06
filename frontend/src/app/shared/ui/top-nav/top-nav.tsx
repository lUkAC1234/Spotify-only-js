import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode } from "react";

import { config } from "@/app/app.config";
import { AuthService } from "@/app/core/services/auth/auth.service";
import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";
import { ThemeToggleBtn } from "@/app/shared/ui/buttons/theme-toggle-btn";
import { LangSelect } from "@/app/shared/ui/lang/lang-select";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_Back } from "@/app/shared/ui/svg/nav/svg-back";
import { SVG_Forward } from "@/app/shared/ui/svg/nav/svg-forward";
import { SVG_Search } from "@/app/shared/ui/svg/nav/svg-search";

import styles from "./top-nav.module.scss";

@observer
export class TopNav extends Component {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);
    private catalog: CatalogService = inject(CatalogService);
    private auth: AuthService = inject(AuthService);

    private handleBack = (): void => {
        window.history.back();
    };

    private handleForward = (): void => {
        window.history.forward();
    };

    private handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
        this.catalog.setQuery(event.target.value);
    };

    private handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const trimmed: string = this.catalog.lastQuery.trim();
        if (!trimmed) return;
        this.navigate.navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    private renderAuthArea(): ReactNode {
        if (this.auth.isAuthenticated && this.auth.me) {
            return (
                <NavLink to="/settings" baseClass={styles["topnav__user"]}>
                    <span className={styles["topnav__user-name"]}>{this.auth.me.displayName}</span>
                </NavLink>
            );
        }

        return (
            <div className={styles["topnav__auth"]}>
                <NavLink to="/register" baseClass={styles["topnav__auth-link"]}>
                    {this.locale.t("common", "auth.sign-up")}
                </NavLink>
                <NavLink to="/login" baseClass={styles["topnav__auth-cta"]}>
                    {this.locale.t("common", "auth.sign-in")}
                </NavLink>
            </div>
        );
    }

    render(): ReactNode {
        const placeholder: string = this.locale.t("common", "search.placeholder");
        const ariaLabel: string = this.locale.t("common", "search.aria-label");

        return (
            <div className={styles["topnav"]}>
                <div className={styles["topnav__history"]}>
                    <button
                        type="button"
                        className={styles["topnav__history-btn"]}
                        onClick={this.handleBack}
                        aria-label={this.locale.t("common", "nav.back")}
                    >
                        <SVG_Back />
                    </button>
                    <button
                        type="button"
                        className={styles["topnav__history-btn"]}
                        onClick={this.handleForward}
                        aria-label={this.locale.t("common", "nav.forward")}
                    >
                        <SVG_Forward />
                    </button>
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
                </form>

                <div className={styles["topnav__controls"]}>
                    <LangSelect mini />
                    <ThemeToggleBtn />
                    {this.renderAuthArea()}
                </div>
            </div>
        );
    }
}
