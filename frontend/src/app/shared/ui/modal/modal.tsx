import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import {
    fadeInOutVariants, modalOverlayVariants, modalScaleVariants, transitionModal, transitionOverlay,
    transitionSync
} from "@/app/core/constants/animation-variants";
import { ModalService } from "@/app/core/services/ui/modal.service";

import styles from "./modal.module.scss";

export type Props = {
    service: ModalService;
};

@observer
export class Modal extends Component<Props> {
    get service(): ModalService {
        return this.props.service;
    }

    closeModalWindow = (): void => {
        this.props.service.toggleWindow(false);
        this.props.service.setComponentClass(null);
    };

    handleKeydown = (evt: KeyboardEvent): void => {
        if (evt.key === "Escape" && this.props.service.isActive) {
            this.closeModalWindow();
        }
    };

    onMouseDown = (evt: React.MouseEvent): void => {
        const target: HTMLElement = evt.target as HTMLElement;
        if (target.classList.contains(styles["modal-wrap"])) {
            this.closeModalWindow();
        }
    };

    componentDidMount(): void {
        if (this.service.disableEscape) {
            document.removeEventListener("keydown", this.handleKeydown);
        } else {
            document.addEventListener("keydown", this.handleKeydown);
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleKeydown);
    }

    render(): ReactNode {
        const { service } = this.props;
        const { componentRenderTrigger, width, height, noTransition } = service;

        if (noTransition) {
            return (
                service.isActive && (
                    <div
                        className={styles["modal-wrap"] + " " + styles["modal-wrap--no-transition"]}
                        onMouseDown={this.onMouseDown}
                    >
                        <div
                            className={styles["modal"]}
                            style={{
                                width: !!width ? `min(calc(100% - 0.5rem), ${width})` : undefined,
                                height: !!height ? `min(calc(100% - 0.5rem), ${height})` : undefined,
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {service.componentClass && (
                                    <div className={styles.content}>
                                        <service.componentClass />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )
            );
        }

        return (
            <AnimatePresence mode="wait">
                {service.isActive && (
                    <motion.div
                        className={styles["modal-wrap"]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={modalOverlayVariants}
                        transition={transitionOverlay}
                        onMouseDown={this.onMouseDown}
                    >
                        <motion.div
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={modalScaleVariants}
                            transition={transitionModal}
                            className={styles["modal"]}
                            style={{
                                width: !!width ? `min(calc(100% - 0.5rem), ${width})` : undefined,
                                height: !!height ? `min(calc(100% - 0.5rem), ${height})` : undefined,
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {service.componentClass && (
                                    <motion.div
                                        key={componentRenderTrigger}
                                        className={styles.content}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        variants={fadeInOutVariants}
                                        transition={transitionSync}
                                    >
                                        <service.componentClass />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }
}
