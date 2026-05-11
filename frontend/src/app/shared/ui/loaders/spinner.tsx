import { Component, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./spinner.module.scss";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerTone = "current" | "accent" | "muted";

interface Props {
    size?: SpinnerSize;
    tone?: SpinnerTone;
    label?: string;
    inline?: boolean;
    className?: string;
}

export class Spinner extends Component<Props> {
    render(): ReactNode {
        const size: SpinnerSize = this.props.size ?? "md";
        const tone: SpinnerTone = this.props.tone ?? "current";
        const label: string = this.props.label ?? "Loading";

        const classes = className(styles["spinner"], {
            [styles[`spinner--${size}`]]: true,
            [styles[`spinner--${tone}`]]: true,
            [styles["spinner--inline"]]: this.props.inline === true,
            ...(this.props.className ? { [this.props.className]: true } : {}),
        });

        return (
            <span className={classes} role="status" aria-live="polite" aria-label={label}>
                <span className={styles["spinner__ring"]} aria-hidden="true" />
            </span>
        );
    }
}
