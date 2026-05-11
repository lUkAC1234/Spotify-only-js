import { Component, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./equalizer.module.scss";

interface Props {
    bars?: number;
    className?: string;
    "aria-label"?: string;
}

export class Equalizer extends Component<Props> {
    static defaultProps: Partial<Props> = {
        bars: 5,
    };

    render(): ReactNode {
        const count = Math.max(2, Math.min(this.props.bars ?? 5, 12));
        const bars: ReactNode[] = [];
        for (let i = 0; i < count; i++) {
            bars.push(<span key={i} className={styles["equalizer__bar"]} style={{ ["--bar-index" as string]: i }} />);
        }

        return (
            <div
                className={className(styles["equalizer"], { [this.props.className ?? ""]: !!this.props.className })}
                role="img"
                aria-label={this.props["aria-label"] ?? "Audio visualisation"}
            >
                {bars}
            </div>
        );
    }
}
