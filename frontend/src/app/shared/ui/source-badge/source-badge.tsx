import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./source-badge.module.scss";

interface Props {
    source: string;
    className?: string;
}

const KNOWN_SOURCES: ReadonlySet<string> = new Set(["jamendo", "audius", "yandex"]);

@observer
export class SourceBadge extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const raw = (this.props.source || "").toLowerCase();
        if (!KNOWN_SOURCES.has(raw)) {
            return null;
        }
        const label = this.locale.t("common", `source.${raw}`);
        const ariaLabel = this.locale.t("common", "source.aria-label", { name: label });
        const badgeClass = className(
            styles["source-badge"],
            styles[`source-badge--${raw}`],
            this.props.className,
        );
        return (
            <span className={badgeClass} aria-label={ariaLabel} title={ariaLabel}>
                {label}
            </span>
        );
    }
}
