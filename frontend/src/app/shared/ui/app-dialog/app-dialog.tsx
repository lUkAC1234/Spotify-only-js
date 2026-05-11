import { AnimatePresence, motion, type Transition } from "framer-motion";
import { Component, MouseEvent, ReactNode, RefObject, createRef } from "react";
import { createPortal } from "react-dom";

import { className } from "@/app/shared/utils/functions/className";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./app-dialog.module.scss";

export type AppDialogSize = "sm" | "md" | "lg";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    ariaLabel?: string;
    size?: AppDialogSize;
    footer?: ReactNode;
    children: ReactNode;
    hideClose?: boolean;
    hideHeader?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    panelClassName?: string;
}

const PANEL_ENTER: Transition = {
    type: "spring",
    stiffness: 380,
    damping: 32,
    mass: 0.85,
};

const PANEL_EXIT: Transition = {
    duration: 0.18,
    ease: [0.4, 0, 1, 1],
};

const BACKDROP_TRANSITION: Transition = {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
};

const panelVariants = {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: PANEL_ENTER },
    exit: { opacity: 0, scale: 0.97, y: 4, transition: PANEL_EXIT },
};

const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: BACKDROP_TRANSITION },
    exit: { opacity: 0, transition: BACKDROP_TRANSITION },
};

export class AppDialog extends Component<Props> {
    static defaultProps: Partial<Props> = {
        size: "md",
        closeOnBackdrop: true,
        closeOnEscape: true,
    };

    private panelRef: RefObject<HTMLDivElement | null> = createRef();
    private wasOpen: boolean = false;
    private previousActiveElement: HTMLElement | null = null;

    componentDidMount(): void {
        if (this.props.isOpen) this.handleOpen();
    }

    componentDidUpdate(prev: Props): void {
        if (prev.isOpen !== this.props.isOpen) {
            if (this.props.isOpen) this.handleOpen();
            else this.handleClose();
        }
    }

    componentWillUnmount(): void {
        if (this.wasOpen) this.handleClose();
    }

    private handleOpen = (): void => {
        this.wasOpen = true;
        if (typeof document !== "undefined") {
            this.previousActiveElement = document.activeElement as HTMLElement | null;
            document.documentElement.classList.add("hide-scrollbar");
            document.addEventListener("keydown", this.handleKey, true);
        }
        requestAnimationFrame(() => {
            const panel = this.panelRef.current;
            if (panel) panel.focus();
        });
    };

    private handleClose = (): void => {
        this.wasOpen = false;
        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("hide-scrollbar");
            document.removeEventListener("keydown", this.handleKey, true);
        }
        if (this.previousActiveElement && typeof this.previousActiveElement.focus === "function") {
            this.previousActiveElement.focus();
            this.previousActiveElement = null;
        }
    };

    private handleKey = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.props.closeOnEscape !== false) {
            event.stopPropagation();
            this.props.onClose();
        }
    };

    private handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
        if (this.props.closeOnBackdrop === false) return;
        if (event.target === event.currentTarget) this.props.onClose();
    };

    render(): ReactNode {
        if (typeof document === "undefined") return null;
        const { isOpen, title, ariaLabel, size, footer, hideClose, hideHeader, panelClassName } = this.props;

        const panelClasses: string = className(styles["dialog__panel"], styles[`dialog__panel--${size}`], {
            [panelClassName ?? ""]: !!panelClassName,
        });

        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="dialog"
                        className={styles["dialog"]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={backdropVariants}
                        onMouseDown={this.handleBackdropMouseDown}
                    >
                        <motion.div
                            ref={this.panelRef}
                            className={panelClasses}
                            role="dialog"
                            aria-modal="true"
                            aria-label={ariaLabel ?? title}
                            tabIndex={-1}
                            variants={panelVariants}
                        >
                            {!hideHeader && (title || !hideClose) && (
                                <header className={styles["dialog__header"]}>
                                    {title && <h2 className={styles["dialog__title"]}>{title}</h2>}
                                    {!hideClose && (
                                        <button
                                            type="button"
                                            className={styles["dialog__close"]}
                                            onClick={this.props.onClose}
                                            aria-label="Close"
                                        >
                                            <SVG_CloseIcon />
                                        </button>
                                    )}
                                </header>
                            )}
                            <div className={styles["dialog__body"]}>{this.props.children}</div>
                            {footer && <footer className={styles["dialog__footer"]}>{footer}</footer>}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body,
        );
    }
}
