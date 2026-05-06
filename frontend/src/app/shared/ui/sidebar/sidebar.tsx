import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_Home } from "@/app/shared/ui/svg/nav/svg-home";
import { SVG_Library } from "@/app/shared/ui/svg/nav/svg-library";
import { SVG_Logo } from "@/app/shared/ui/svg/nav/svg-logo";
import { SVG_Plus } from "@/app/shared/ui/svg/nav/svg-plus";
import { SVG_Search } from "@/app/shared/ui/svg/nav/svg-search";

import styles from "./sidebar.module.scss";

interface NavItem {
    path: string;
    labelKey: keyof typeof navLabelKeys;
    Icon: typeof SVG_Home;
}

const navLabelKeys = {
    home: "nav.home",
    search: "nav.search",
    library: "nav.library",
} as const;

const navItems: NavItem[] = [
    { path: "/", labelKey: "home", Icon: SVG_Home },
    { path: "/search", labelKey: "search", Icon: SVG_Search },
    { path: "/library", labelKey: "library", Icon: SVG_Library },
];

@observer
export class Sidebar extends Component {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        return (
            <nav className={styles["sidebar"]} aria-label="Primary">
                <NavLink to="/" baseClass={styles["sidebar__brand"]} end>
                    <SVG_Logo className={styles["sidebar__brand-logo"]} />
                    <span className={styles["sidebar__brand-name"]}>
                        {this.locale.t("common", "app.name")}
                    </span>
                </NavLink>

                <ul className={styles["sidebar__nav"]}>
                    {navItems.map(({ path, labelKey, Icon }) => (
                        <li key={path} className={styles["sidebar__nav-item"]}>
                            <NavLink
                                to={path}
                                end={path === "/"}
                                baseClass={styles["sidebar__link"]}
                                activeClass={styles["sidebar__link--active"]}
                            >
                                <Icon className={styles["sidebar__icon"]} />
                                <span className={styles["sidebar__label"]}>
                                    {this.locale.t("common", navLabelKeys[labelKey])}
                                </span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className={styles["sidebar__divider"]} aria-hidden="true" />

                <button
                    type="button"
                    className={styles["sidebar__create"]}
                    disabled
                    aria-disabled="true"
                    title={this.locale.t("common", "playlist.create-disabled")}
                >
                    <SVG_Plus className={styles["sidebar__create-icon"]} />
                    <span className={styles["sidebar__label"]}>
                        {this.locale.t("common", "playlist.create")}
                    </span>
                </button>
            </nav>
        );
    }
}
