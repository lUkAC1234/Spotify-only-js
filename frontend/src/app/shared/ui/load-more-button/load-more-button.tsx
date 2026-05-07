import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./load-more-button.module.scss";

interface Props {
    onClick: () => void;
    isLoading?: boolean;
    label?: string;
    fullWidth?: boolean;
}

export class LoadMoreButton extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { onClick, isLoading, label, fullWidth } = this.props;
        const text = isLoading
            ? this.locale.t("common", "common.loading-more")
            : (label ?? this.locale.t("common", "common.load-more"));
        return (
            <div
                className={className(styles["load-more"], {
                    [styles["load-more--full"]]: !!fullWidth,
                })}
            >
                <button
                    type="button"
                    className={styles["load-more__btn"]}
                    onClick={onClick}
                    disabled={isLoading}
                    aria-busy={isLoading}
                >
                    <span className={styles["load-more__label"]}>{text}</span>
                </button>
            </div>
        );
    }
}
