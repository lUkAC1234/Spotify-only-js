import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./coming-soon.module.scss";

interface Props {
    phase: number;
    titleKey: string;
}

@observer
export class ComingSoon extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { phase, titleKey } = this.props;
        return (
            <section className={styles["coming-soon"]}>
                <span className={styles["coming-soon__phase"]}>
                    {this.locale.t("common", "coming-soon.phase", { phase: String(phase) })}
                </span>
                <h1 className={styles["coming-soon__title"]}>{this.locale.t("common", titleKey as never)}</h1>
                <p className={styles["coming-soon__hint"]}>
                    {this.locale.t("common", "coming-soon.hint")}
                </p>
            </section>
        );
    }
}
