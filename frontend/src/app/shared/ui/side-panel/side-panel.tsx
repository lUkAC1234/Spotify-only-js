import { AnimatePresence, motion, type Transition } from "framer-motion";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./side-panel.module.scss";

interface Props {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    ariaLabel?: string;
    closeAriaLabel?: string;
    showBackdrop?: boolean;
}

const PANEL_ENTER: Transition = {
    type: "spring",
    stiffness: 360,
    damping: 36,
    mass: 0.9,
};

const PANEL_EXIT: Transition = {
    duration: 0.24,
    ease: [0.4, 0, 0.2, 1],
};

const SCRIM_TRANSITION: Transition = {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1],
};

const panelVariants = {
    initial: { x: "calc(100% + 24px)", opacity: 0 },
    animate: { x: 0, opacity: 1, transition: PANEL_ENTER },
    exit: { x: "calc(100% + 24px)", opacity: 0, transition: PANEL_EXIT },
};

const scrimVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: SCRIM_TRANSITION },
    exit: { opacity: 0, transition: SCRIM_TRANSITION },
};

@observer
export class SidePanel extends Component<Props> {
    static defaultProps: Partial<Props> = {
        showBackdrop: true,
    };

    private locale: LocaleService = inject(LocaleService);

    componentDidMount(): void {
        document.addEventListener("keydown", this.handleKeydown);
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleKeydown);
    }

    private handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.props.isOpen) {
            event.stopPropagation();
            this.props.onClose();
        }
    };

    private handleScrimClick = (): void => {
        this.props.onClose();
    };

    render(): ReactNode {
        const { isOpen, title, onClose, children, ariaLabel, closeAriaLabel, showBackdrop } = this.props;
        const closeLabel = closeAriaLabel ?? this.locale.t("common", "playlist.close");

        return (
            <>
                <AnimatePresence>
                    {isOpen && showBackdrop !== false && (
                        <motion.button
                            key="scrim"
                            type="button"
                            className={styles["panel-scrim"]}
                            onClick={this.handleScrimClick}
                            aria-label={closeLabel}
                            tabIndex={-1}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={scrimVariants}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isOpen && (
                        <motion.aside
                            key="panel"
                            className={styles["panel"]}
                            role="dialog"
                            aria-modal="false"
                            aria-label={ariaLabel ?? title}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={panelVariants}
                        >
                            <header className={styles["panel__header"]}>
                                <h2 className={styles["panel__title"]}>{title}</h2>
                                <button
                                    type="button"
                                    className={styles["panel__close"]}
                                    onClick={onClose}
                                    aria-label={closeLabel}
                                >
                                    <SVG_CloseIcon />
                                </button>
                            </header>
                            <div className={styles["panel__body"]}>{children}</div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </>
        );
    }
}
