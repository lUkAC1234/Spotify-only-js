import { CSSProperties, Component, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./skeleton.module.scss";

export type SkeletonShape = "block" | "text" | "circle";

interface Props {
    shape?: SkeletonShape;
    width?: string;
    height?: string;
    radius?: string;
    className?: string;
    label?: string;
}

export class Skeleton extends Component<Props> {
    render(): ReactNode {
        const shape: SkeletonShape = this.props.shape ?? "block";
        const style: CSSProperties = {};
        if (this.props.width) style.width = this.props.width;
        if (this.props.height) style.height = this.props.height;
        if (this.props.radius) style.borderRadius = this.props.radius;

        const classes = className(styles["skeleton"], {
            [styles[`skeleton--${shape}`]]: true,
            ...(this.props.className ? { [this.props.className]: true } : {}),
        });

        return (
            <span
                className={classes}
                style={style}
                role="status"
                aria-busy="true"
                aria-live="polite"
                aria-label={this.props.label ?? "Loading"}
            />
        );
    }
}
