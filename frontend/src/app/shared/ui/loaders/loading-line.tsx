import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { HttpQueue } from "@/app/core/services/http/http-queue.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./loading-line.module.scss";

@observer
export class LoadingLine extends Component {
    httpQueue: HttpQueue = inject(HttpQueue);

    render(): ReactNode {
        return (
            <div className={styles["progresses"]}>
                {this.httpQueue.httpMapList.map(([key, { state, progress }]) => {
                    const isLoading: boolean = state === "loading";
                    const className: string = isLoading
                        ? `${styles["progress"]} ${styles["progress--active"]}`
                        : styles["progress"];
                    return <progress key={key} className={className} value={progress} max={100} />;
                })}
            </div>
        );
    }
}
