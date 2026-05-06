import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { createPortal } from "react-dom";

import { fadeInOutVariants, transitionSync } from "@/app/core/constants/animation-variants";

import { inject } from "../../decorators/di";
import styles from "./alert.module.scss";
import { AlertService } from "./alert.service";
import { Alerts } from "./alerts";

@observer
export class AlertRoot extends Component {
    service: AlertService = inject(AlertService);

    render(): ReactNode {
        return createPortal(
            <AnimatePresence>
                {this.service.alertIsActive && (
                    <motion.div
                        className={styles["alerts-wrap"]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={fadeInOutVariants}
                        transition={transitionSync}
                    >
                        <Alerts />
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body,
        );
    }
}
