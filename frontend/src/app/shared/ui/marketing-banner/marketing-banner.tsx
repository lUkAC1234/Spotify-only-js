import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./marketing-banner.module.scss";

@observer
export class MarketingBanner extends Component {
    private auth: AuthService = inject(AuthService);
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        if (this.auth.isAuthenticated) return null;

        return (
            <aside className={styles["banner"]} role="region" aria-label={this.locale.t("common", "marketing.title")}>
                <div className={styles["banner__copy"]}>
                    <span className={styles["banner__overline"]}>
                        {this.locale.t("common", "marketing.title")}
                    </span>
                    <p className={styles["banner__sub"]}>
                        {this.locale.t("common", "marketing.subtitle")}
                    </p>
                </div>
                <NavLink to="/register" baseClass={styles["banner__cta"]}>
                    {this.locale.t("common", "marketing.cta")}
                </NavLink>
            </aside>
        );
    }
}
