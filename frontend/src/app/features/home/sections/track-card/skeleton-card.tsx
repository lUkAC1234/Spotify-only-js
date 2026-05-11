import { Component, ReactNode } from "react";

import { Skeleton } from "@/app/shared/ui/skeleton/skeleton";

import skeleton from "./skeleton-card.module.scss";
import styles from "./track-card.module.scss";

export class SkeletonCard extends Component {
    render(): ReactNode {
        return (
            <li className={`${styles["track-card"]} ${skeleton["skeleton-card"]}`} aria-hidden="true">
                <Skeleton variant="block" className={styles["track-card__cover"]} />
                <Skeleton variant="line" className={skeleton["skeleton-card__line"]} />
                <Skeleton variant="line" className={skeleton["skeleton-card__line-sm"]} />
            </li>
        );
    }
}
