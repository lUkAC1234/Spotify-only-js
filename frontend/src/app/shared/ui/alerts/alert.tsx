import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "./alert.module.scss";
import { Alerts } from "./alerts";

@observer
export class AlertRoot extends Component {
    render(): ReactNode {
        if (typeof document === "undefined") return null;
        return createPortal(
            <div className={styles["alerts-wrap"]}>
                <Alerts />
            </div>,
            document.body,
        );
    }
}
