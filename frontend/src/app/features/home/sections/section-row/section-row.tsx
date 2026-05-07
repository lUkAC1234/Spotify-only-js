import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./section-row.module.scss";

interface Props {
    title: string;
    subtitle?: string;
    showAllHref?: string;
    children: ReactNode;
}

export class SectionRow extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { title, subtitle, showAllHref, children } = this.props;
        return (
            <section className={styles["section-row"]}>
                <header className={styles["section-row__header"]}>
                    <div className={styles["section-row__heading"]}>
                        <h2 className={styles["section-row__title"]}>{title}</h2>
                        {subtitle && <span className={styles["section-row__subtitle"]}>{subtitle}</span>}
                    </div>
                    {showAllHref && (
                        <NavLink to={showAllHref} baseClass={styles["section-row__show-all"]}>
                            {this.locale.t("common", "show-all")}
                        </NavLink>
                    )}
                </header>
                <Carousel>
                    <ul className={styles["section-row__list"]} aria-label={title}>
                        {children}
                    </ul>
                </Carousel>
            </section>
        );
    }
}
