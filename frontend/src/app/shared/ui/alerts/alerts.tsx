import { AnimatePresence, motion, type Transition, type Variants } from "framer-motion";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { className } from "@/app/shared/utils/functions/className";

import { inject } from "../../decorators/di";
import { SVG_AlertError } from "../svg/alerts/svg-alert-error";
import { SVG_AlertInfo } from "../svg/alerts/svg-alert-info";
import { SVG_AlertSuccess } from "../svg/alerts/svg-alert-success";
import { SVG_AlertWarning } from "../svg/alerts/svg-alert-warning";
import { SVG_CloseIcon } from "../svg/svg-close-icon";
import { AlertMessage } from "./alert-message";
import styles from "./alert.module.scss";
import { AlertEntry, AlertService, AlertType } from "./alert.service";

const ICONS: Record<AlertType, React.ComponentType<{ className?: string }>> = {
    info: SVG_AlertInfo,
    success: SVG_AlertSuccess,
    warning: SVG_AlertWarning,
    error: SVG_AlertError,
};

const ENTER_TRANSITION: Transition = {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.85,
};

const EXIT_TRANSITION: Transition = {
    duration: 0.18,
    ease: [0.4, 0, 1, 1],
};

const itemVariants: Variants = {
    initial: { opacity: 0, x: 24, scale: 0.96 },
    animate: { opacity: 1, x: 0, scale: 1, transition: ENTER_TRANSITION },
    exit: { opacity: 0, x: 24, scale: 0.97, transition: EXIT_TRANSITION },
};

@observer
export class Alerts extends Component {
    private service: AlertService = inject(AlertService);
    private locale: LocaleService = inject(LocaleService);

    private renderAlert = (entry: AlertEntry): ReactNode => {
        const Icon = ICONS[entry.type];
        const showTimer = entry.delay > 0;
        return (
            <motion.li
                layout
                key={entry.hash}
                className={className(styles["alert"], styles[`alert--${entry.type}`])}
                role={entry.type === "error" || entry.type === "warning" ? "alert" : "status"}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={itemVariants}
            >
                <span className={styles["alert__icon"]} aria-hidden="true">
                    <Icon />
                </span>
                <div className={styles["alert__content"]}>
                    {entry.title && <p className={styles["alert__title"]}>{entry.title}</p>}
                    <p className={styles["alert__message"]}>
                        <AlertMessage>{entry.message}</AlertMessage>
                    </p>
                </div>
                <button
                    type="button"
                    className={styles["alert__close"]}
                    onClick={() => this.service.deleteAlert(entry.hash)}
                    aria-label={this.locale.t("common", "common.close")}
                >
                    <SVG_CloseIcon />
                </button>
                {showTimer && (
                    <span
                        className={styles["alert__timer"]}
                        style={{ animationDuration: `${entry.delay}ms` }}
                        aria-hidden="true"
                    />
                )}
            </motion.li>
        );
    };

    render(): ReactNode {
        return (
            <ul className={styles["alerts-list"]} aria-live="polite" aria-relevant="additions">
                <AnimatePresence initial={false}>
                    {this.service.alertsList.map(this.renderAlert)}
                </AnimatePresence>
            </ul>
        );
    }
}
