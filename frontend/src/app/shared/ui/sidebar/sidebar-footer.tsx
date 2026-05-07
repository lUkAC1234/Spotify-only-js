import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { LEGAL_LINKS } from "@/app/shared/constants/legal-links";
import { inject } from "@/app/shared/decorators/di";
import { ThemeToggleBtn } from "@/app/shared/ui/buttons/theme-toggle-btn";
import { LangSelect } from "@/app/shared/ui/lang/lang-select";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./sidebar-footer.module.scss";

@observer
export class SidebarFooter extends Component {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        return (
            <footer className={styles["footer"]}>
                <ul className={styles["footer__links"]}>
                    {LEGAL_LINKS.map((link) => (
                        <li key={link.tKey} className={styles["footer__link-item"]}>
                            <NavLink to={link.to} baseClass={styles["footer__link"]}>
                                {this.locale.t("common", link.tKey)}
                            </NavLink>
                        </li>
                    ))}
                </ul>
                <div className={styles["footer__controls"]}>
                    <LangSelect />
                    <ThemeToggleBtn />
                </div>
            </footer>
        );
    }
}
