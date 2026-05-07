import { Component, ReactNode } from "react";

import styles from "./menu.module.scss";

export class MenuDivider extends Component {
    render(): ReactNode {
        return <li role="separator" className={styles["divider"]} />;
    }
}
