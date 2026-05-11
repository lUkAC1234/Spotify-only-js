import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { Outlet } from "react-router";

import { LocaleService } from "@/app/core/services/locale.service";
import { _static } from "@/app/shared/decorators/static";
import { inject } from "@/app/shared/decorators/di";
import { ThemeToggleBtn } from "@/app/shared/ui/buttons/theme-toggle-btn";
import { LangSelect } from "@/app/shared/ui/lang/lang-select";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_SpotifyBadge } from "@/app/shared/ui/svg/nav/svg-spotify-badge";

import styles from "./auth-layout.module.scss";

@_static
@observer
export class AuthLayout extends Component {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        return (
            <div className={styles["auth-layout"]}>
                <div className={styles["auth-layout__glow"]} aria-hidden="true" />

                <header className={styles["auth-layout__header"]}>
                    <NavLink
                        to="/"
                        baseClass={styles["auth-layout__brand"]}
                        aria-label={this.locale.t("common", "topnav.brand-aria")}
                    >
                        <SVG_SpotifyBadge className={styles["auth-layout__brand-logo"]} />
                        <span className={styles["auth-layout__brand-name"]}>
                            {this.locale.t("common", "app.name")}
                        </span>
                    </NavLink>
                    <div className={styles["auth-layout__controls"]}>
                        <LangSelect />
                        <ThemeToggleBtn />
                    </div>
                </header>

                <main className={styles["auth-layout__main"]}>
                    <div className={styles["auth-layout__card"]}>
                        <Outlet />
                    </div>
                </main>

                <footer className={styles["auth-layout__footer"]}>
                    <p className={styles["auth-layout__legal-line"]}>
                        <span>© {new Date().getFullYear()} Spenzora</span>
                        <NavLink to="/privacy" baseClass={styles["auth-layout__legal-link"]}>
                            {this.locale.t("common", "sidebar.footer.privacy")}
                        </NavLink>
                        <NavLink to="/cookies" baseClass={styles["auth-layout__legal-link"]}>
                            {this.locale.t("common", "sidebar.footer.cookies")}
                        </NavLink>
                        <NavLink to="/legal" baseClass={styles["auth-layout__legal-link"]}>
                            {this.locale.t("common", "sidebar.footer.legal")}
                        </NavLink>
                    </p>
                </footer>
            </div>
        );
    }
}
