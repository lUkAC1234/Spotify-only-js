import { AnimatePresence, motion, type Transition } from "framer-motion";
import { Component, ReactNode, RefObject, createRef } from "react";
import { createPortal } from "react-dom";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./popover.module.scss";

export type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end" | "right-start" | "left-start";

interface Props {
    isOpen: boolean;
    anchorRef: RefObject<HTMLElement | null>;
    placement?: PopoverPlacement;
    onClose: () => void;
    children: ReactNode;
    label?: string;
    matchAnchorWidth?: boolean;
    offset?: number;
    closeOnContentClick?: boolean;
}

interface State {
    coords: { top: number; left: number; width: number } | null;
    resolvedPlacement: PopoverPlacement;
}

const ENTER_TRANSITION: Transition = {
    type: "spring",
    stiffness: 520,
    damping: 38,
    mass: 0.7,
};

const EXIT_TRANSITION: Transition = {
    duration: 0.22,
    ease: [0.32, 0, 0.67, 0],
};

const placementOrigin: Record<PopoverPlacement, { x: number; y: number }> = {
    "bottom-start": { x: 0, y: -10 },
    "bottom-end": { x: 0, y: -10 },
    "top-start": { x: 0, y: 10 },
    "top-end": { x: 0, y: 10 },
    "right-start": { x: -10, y: 0 },
    "left-start": { x: 10, y: 0 },
};

export class Popover extends Component<Props, State> {
    static defaultProps = {
        placement: "bottom-start" as PopoverPlacement,
        offset: 8,
        closeOnContentClick: false,
    };

    state: State = {
        coords: null,
        resolvedPlacement: "bottom-start",
    };

    private wrapperRef: RefObject<HTMLDivElement | null> = createRef();
    private rafId: number | null = null;

    componentDidMount(): void {
        if (this.props.isOpen) {
            this.attachListeners();
            this.scheduleReposition();
        }
    }

    componentDidUpdate(prev: Props): void {
        if (prev.isOpen !== this.props.isOpen) {
            if (this.props.isOpen) {
                this.attachListeners();
                this.scheduleReposition();
            } else {
                this.detachListeners();
            }
        }
    }

    componentWillUnmount(): void {
        this.detachListeners();
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    }

    private attachListeners = (): void => {
        document.addEventListener("mousedown", this.handlePointer, true);
        document.addEventListener("keydown", this.handleKey, true);
        window.addEventListener("resize", this.scheduleReposition);
        window.addEventListener("scroll", this.scheduleReposition, true);
    };

    private detachListeners = (): void => {
        document.removeEventListener("mousedown", this.handlePointer, true);
        document.removeEventListener("keydown", this.handleKey, true);
        window.removeEventListener("resize", this.scheduleReposition);
        window.removeEventListener("scroll", this.scheduleReposition, true);
    };

    private handlePointer = (event: MouseEvent): void => {
        const target = event.target as Node;
        const anchor = this.props.anchorRef.current;
        const wrapper = this.wrapperRef.current;
        if (anchor && anchor.contains(target)) return;
        if (wrapper && wrapper.contains(target)) {
            if (this.props.closeOnContentClick) this.props.onClose();
            return;
        }
        this.props.onClose();
    };

    private handleKey = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            event.stopPropagation();
            this.props.onClose();
            const anchor = this.props.anchorRef.current;
            if (anchor && typeof anchor.focus === "function") anchor.focus();
        }
    };

    private scheduleReposition = (): void => {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(this.reposition);
    };

    private reposition = (): void => {
        this.rafId = null;
        const anchor = this.props.anchorRef.current;
        const wrapper = this.wrapperRef.current;
        if (!anchor || !wrapper) return;

        const aRect = anchor.getBoundingClientRect();
        const pWidth = wrapper.offsetWidth;
        const pHeight = wrapper.offsetHeight;
        const offset = this.props.offset ?? 8;
        const margin = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const placement = this.props.placement ?? "bottom-start";

        let top = 0;
        let left = 0;
        let resolved: PopoverPlacement = placement;

        switch (placement) {
            case "bottom-start":
                top = aRect.bottom + offset;
                left = aRect.left;
                if (top + pHeight > vh - margin) {
                    top = aRect.top - pHeight - offset;
                    resolved = "top-start";
                }
                break;
            case "bottom-end":
                top = aRect.bottom + offset;
                left = aRect.right - pWidth;
                if (top + pHeight > vh - margin) {
                    top = aRect.top - pHeight - offset;
                    resolved = "top-end";
                }
                break;
            case "top-start":
                top = aRect.top - pHeight - offset;
                left = aRect.left;
                if (top < margin) {
                    top = aRect.bottom + offset;
                    resolved = "bottom-start";
                }
                break;
            case "top-end":
                top = aRect.top - pHeight - offset;
                left = aRect.right - pWidth;
                if (top < margin) {
                    top = aRect.bottom + offset;
                    resolved = "bottom-end";
                }
                break;
            case "right-start":
                top = aRect.top;
                left = aRect.right + offset;
                if (left + pWidth > vw - margin) {
                    left = aRect.left - pWidth - offset;
                    resolved = "left-start";
                }
                break;
            case "left-start":
                top = aRect.top;
                left = aRect.left - pWidth - offset;
                if (left < margin) {
                    left = aRect.right + offset;
                    resolved = "right-start";
                }
                break;
        }

        if (left + pWidth > vw - margin) left = vw - pWidth - margin;
        if (left < margin) left = margin;
        if (top + pHeight > vh - margin) top = vh - pHeight - margin;
        if (top < margin) top = margin;

        const width = aRect.width;
        this.setState({ coords: { top, left, width }, resolvedPlacement: resolved });
    };

    private handleEnterComplete = (): void => {
        this.scheduleReposition();
    };

    render(): ReactNode {
        const { isOpen, matchAnchorWidth, label } = this.props;
        const { coords, resolvedPlacement } = this.state;
        const origin = placementOrigin[resolvedPlacement];

        const wrapperStyle: React.CSSProperties = {
            top: coords ? `${coords.top}px` : "0px",
            left: coords ? `${coords.left}px` : "0px",
            visibility: coords ? "visible" : "hidden",
        };
        if (matchAnchorWidth && coords) wrapperStyle.width = `${coords.width}px`;

        const variants = {
            initial: { opacity: 0, scale: 0.94, x: origin.x, y: origin.y },
            animate: {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                transition: ENTER_TRANSITION,
            },
            exit: {
                opacity: 0,
                scale: 0.92,
                x: origin.x,
                y: origin.y,
                transition: EXIT_TRANSITION,
            },
        };

        return createPortal(
            <AnimatePresence onExitComplete={this.detachListeners}>
                {isOpen && (
                    <motion.div
                        ref={this.wrapperRef}
                        key="popover"
                        className={className(styles["popover"], {
                            [styles[`popover--${resolvedPlacement}`]]: true,
                        })}
                        style={wrapperStyle}
                        role="presentation"
                        aria-label={label}
                        data-placement={resolvedPlacement}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={variants}
                        onAnimationComplete={this.handleEnterComplete}
                    >
                        {this.props.children}
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body,
        );
    }
}
