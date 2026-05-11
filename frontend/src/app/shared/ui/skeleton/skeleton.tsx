import { Component, CSSProperties, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./skeleton.module.scss";

export type SkeletonVariant = "block" | "line" | "circle" | "text";

interface Props {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    radius?: string;
    className?: string;
    "aria-label"?: string;
}

const formatSize = (value: string | number | undefined): string | undefined => {
    if (value === undefined) return undefined;
    return typeof value === "number" ? `${value}px` : value;
};

export class Skeleton extends Component<Props> {
    static defaultProps: Partial<Props> = {
        variant: "block",
    };

    render(): ReactNode {
        const { variant, width, height, radius } = this.props;
        const style: CSSProperties = {};
        const w = formatSize(width);
        const h = formatSize(height);
        if (w) style.width = w;
        if (h) style.height = h;
        if (radius) style.borderRadius = radius;

        const cls = className(`${styles["skeleton"]} ${styles[`skeleton--${variant}`]}`, {
            [this.props.className ?? ""]: !!this.props.className,
        });

        return <span className={cls} style={style} aria-hidden="true" role="presentation" />;
    }
}
