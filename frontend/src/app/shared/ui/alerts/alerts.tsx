import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { scaleInOutVariants, transitionSync } from "@/app/core/constants/animation-variants";

import { inject } from "../../decorators/di";
import { CloseButton } from "../buttons/close-button";
import { AlertMessage } from "./alert-message";
import styles from "./alert.module.scss";
import { AlertService } from "./alert.service";

@observer
export class Alerts extends Component {
    service: AlertService = inject(AlertService);

    render(): ReactNode {
        return (
            <AnimatePresence>
                {this.service.alertsList.map(([hash, { message }]) => (
                    <motion.div
                        layout
                        key={hash}
                        className={styles["alert"]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transitionSync}
                        variants={scaleInOutVariants}
                    >
                        <AlertMessage>{message}</AlertMessage>
                        <CloseButton
                            position="absolute"
                            alignX="right"
                            alignY="top"
                            onClick={() => this.service.deleteAlert(hash)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        );
    }
}
