import { PureComponent, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./avatar.module.scss";

interface Props {
    name: string;
    image?: string | null;
    draggable?: boolean;
}

const VARIANT_COUNT = 6;

const hashName = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
};

export class Avatar extends PureComponent<Props> {
    render(): ReactNode {
        const { name, image, draggable = false } = this.props;
        if (image) {
            return (
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    draggable={draggable}
                    className={styles["avatar-img"]}
                />
            );
        }
        const trimmed = (name ?? "").trim();
        const initial = (trimmed.charAt(0) || "?").toUpperCase();
        const variant = hashName(trimmed || "?") % VARIANT_COUNT;
        const classes = className(styles["avatar-fallback"], {
            [styles[`avatar-fallback--v${variant}`]]: true,
        });
        return (
            <span className={classes} aria-hidden="true">
                <span className={styles["avatar-letter"]}>{initial}</span>
            </span>
        );
    }
}
