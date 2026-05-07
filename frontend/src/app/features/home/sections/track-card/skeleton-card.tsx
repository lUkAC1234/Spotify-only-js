import { Component, ReactNode } from "react";

import skeleton from "./skeleton-card.module.scss";
import styles from "./track-card.module.scss";

export class SkeletonCard extends Component {
    render(): ReactNode {
        return (
            <li className={`${styles["track-card"]} ${skeleton["skeleton-card"]}`} aria-hidden="true">
                <div className={styles["track-card__cover"]} />
                <div className={skeleton["skeleton-card__line"]} />
                <div className={skeleton["skeleton-card__line-sm"]} />
            </li>
        );
    }
}
