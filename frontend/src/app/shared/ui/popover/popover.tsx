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

    private panelRef: RefObject<HTMLDivElement | null> = createRef();
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
                this.setState({ coords: null });
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
        const panel = this.panelRef.current;
        if (anchor && anchor.contains(target)) return;
        if (panel && panel.contains(target)) {
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
        const panel = this.panelRef.current;
        if (!anchor || !panel) return;

        const aRect = anchor.getBoundingClientRect();
        const pRect = panel.getBoundingClientRect();
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
                if (top + pRect.height > vh - margin) {
                    top = aRect.top - pRect.height - offset;
                    resolved = "top-start";
                }
                break;
            case "bottom-end":
                top = aRect.bottom + offset;
                left = aRect.right - pRect.width;
                if (top + pRect.height > vh - margin) {
                    top = aRect.top - pRect.height - offset;
                    resolved = "top-end";
                }
                break;
            case "top-start":
                top = aRect.top - pRect.height - offset;
                left = aRect.left;
                if (top < margin) {
                    top = aRect.bottom + offset;
                    resolved = "bottom-start";
                }
                break;
            case "top-end":
                top = aRect.top - pRect.height - offset;
                left = aRect.right - pRect.width;
                if (top < margin) {
                    top = aRect.bottom + offset;
                    resolved = "bottom-end";
                }
                break;
            case "right-start":
                top = aRect.top;
                left = aRect.right + offset;
                if (left + pRect.width > vw - margin) {
                    left = aRect.left - pRect.width - offset;
                    resolved = "left-start";
                }
                break;
            case "left-start":
                top = aRect.top;
                left = aRect.left - pRect.width - offset;
                if (left < margin) {
                    left = aRect.right + offset;
                    resolved = "right-start";
                }
                break;
        }

        if (left + pRect.width > vw - margin) left = vw - pRect.width - margin;
        if (left < margin) left = margin;
        if (top + pRect.height > vh - margin) top = vh - pRect.height - margin;
        if (top < margin) top = margin;

        const width = aRect.width;
        this.setState({ coords: { top, left, width }, resolvedPlacement: resolved });
    };

    render(): ReactNode {
        if (!this.props.isOpen) return null;
        const { coords, resolvedPlacement } = this.state;
        const style: React.CSSProperties = {
            top: coords ? `${coords.top}px` : "-9999px",
            left: coords ? `${coords.left}px` : "-9999px",
            visibility: coords ? "visible" : "hidden",
        };
        if (this.props.matchAnchorWidth && coords) style.width = `${coords.width}px`;

        return createPortal(
            <div
                ref={this.panelRef}
                className={className(styles["popover"], {
                    [styles[`popover--${resolvedPlacement}`]]: true,
                })}
                style={style}
                role="presentation"
                aria-label={this.props.label}
                data-placement={resolvedPlacement}
            >
                {this.props.children}
            </div>,
            document.body,
        );
    }
}
