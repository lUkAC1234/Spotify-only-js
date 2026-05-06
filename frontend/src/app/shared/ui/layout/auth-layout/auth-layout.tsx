import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { Outlet } from "react-router";

import { LocaleService } from "@/app/core/services/locale.service";
import { _static } from "@/app/shared/decorators/static";
import { inject } from "@/app/shared/decorators/di";
import { ThemeToggleBtn } from "@/app/shared/ui/buttons/theme-toggle-btn";
import { LangSelect } from "@/app/shared/ui/lang/lang-select";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_Logo } from "@/app/shared/ui/svg/nav/svg-logo";

import styles from "./auth-layout.module.scss";

@_static
@observer
export class AuthLayout extends Component {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        return (
            <div className={styles["auth-layout"]}>
                <header className={styles["auth-layout__header"]}>
                    <NavLink to="/" baseClass={styles["auth-layout__brand"]}>
                        <SVG_Logo className={styles["auth-layout__brand-logo"]} />
                        <span className={styles["auth-layout__brand-name"]}>
                            {this.locale.t("common", "app.name")}
                        </span>
                    </NavLink>
                    <div className={styles["auth-layout__controls"]}>
                        <LangSelect mini />
                        <ThemeToggleBtn />
                    </div>
                </header>
                <main className={styles["auth-layout__main"]}>
                    <div className={styles["auth-layout__card"]}>
                        <Outlet />
                    </div>
                </main>
            </div>
        );
    }
}
