import { Component, PointerEvent, ReactNode, RefObject, createRef } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./carousel.module.scss";

interface Props {
    children: ReactNode;
}

interface State {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    isDragging: boolean;
}

const DRAG_THRESHOLD = 6;
const SCROLL_PAGE_RATIO = 0.85;
const ANIM_DURATION = 380;
const MOMENTUM_TIME_WINDOW = 100;
const MOMENTUM_DECAY = 0.94;
const MOMENTUM_MIN_VELOCITY = 0.04;
const MOMENTUM_KICK_THRESHOLD = 0.18;

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export class Carousel extends Component<Props, State> {
    private locale: LocaleService = inject(LocaleService);
    private scrollRef: RefObject<HTMLDivElement | null> = createRef();
    private resizeObserver: ResizeObserver | null = null;

    private dragOriginX: number = 0;
    private dragOriginScrollLeft: number = 0;
    private dragMoved: boolean = false;
    private dragPointerId: number | null = null;
    private velocitySamples: { time: number; x: number }[] = [];
    private momentumRaf: number | null = null;
    private animateRaf: number | null = null;
    private boundariesRaf: number | null = null;
    private isUnmounted: boolean = false;
    private preventNextClick: boolean = false;

    state: State = {
        canScrollLeft: false,
        canScrollRight: false,
        isDragging: false,
    };

    componentDidMount(): void {
        this.scheduleBoundaries();
        const node = this.scrollRef.current;
        if (!node) return;
        node.addEventListener("scroll", this.handleScroll, { passive: true });
        node.addEventListener("wheel", this.handleWheel, { passive: false });
        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(this.scheduleBoundaries);
            this.resizeObserver.observe(node);
        }
        window.addEventListener("resize", this.scheduleBoundaries);
    }

    componentDidUpdate(): void {
        this.scheduleBoundaries();
    }

    componentWillUnmount(): void {
        this.isUnmounted = true;
        const node = this.scrollRef.current;
        node?.removeEventListener("scroll", this.handleScroll);
        node?.removeEventListener("wheel", this.handleWheel);
        this.resizeObserver?.disconnect();
        window.removeEventListener("resize", this.scheduleBoundaries);
        this.cancelMomentum();
        this.cancelAnimate();
        if (this.boundariesRaf !== null) {
            cancelAnimationFrame(this.boundariesRaf);
            this.boundariesRaf = null;
        }
    }

    private scheduleBoundaries = (): void => {
        if (this.boundariesRaf !== null) return;
        this.boundariesRaf = requestAnimationFrame(() => {
            this.boundariesRaf = null;
            if (this.isUnmounted) return;
            this.updateBoundaries();
        });
    };

    private updateBoundaries = (): void => {
        const node = this.scrollRef.current;
        if (!node) return;
        const canScrollLeft = node.scrollLeft > 1;
        const canScrollRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 1;
        if (
            canScrollLeft !== this.state.canScrollLeft ||
            canScrollRight !== this.state.canScrollRight
        ) {
            this.setState({ canScrollLeft, canScrollRight });
        }
    };

    private handleScroll = (): void => {
        this.scheduleBoundaries();
    };

    private handleWheel = (event: WheelEvent): void => {
        const node = this.scrollRef.current;
        if (!node) return;
        if (event.deltaX !== 0 && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            return;
        }
        if (!event.shiftKey) return;
        event.preventDefault();
        node.scrollLeft += event.deltaY;
    };

    private cancelMomentum = (): void => {
        if (this.momentumRaf !== null) {
            cancelAnimationFrame(this.momentumRaf);
            this.momentumRaf = null;
        }
    };

    private cancelAnimate = (): void => {
        if (this.animateRaf !== null) {
            cancelAnimationFrame(this.animateRaf);
            this.animateRaf = null;
        }
    };

    private animateScrollTo = (target: number): void => {
        const node = this.scrollRef.current;
        if (!node) return;
        this.cancelAnimate();
        this.cancelMomentum();
        const start = node.scrollLeft;
        const max = node.scrollWidth - node.clientWidth;
        const clamped = Math.max(0, Math.min(target, max));
        const distance = clamped - start;
        if (Math.abs(distance) < 1) return;
        const startTime = performance.now();
        const tick = (now: number): void => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / ANIM_DURATION);
            const eased = easeOutQuart(t);
            node.scrollLeft = start + distance * eased;
            if (t < 1) {
                this.animateRaf = requestAnimationFrame(tick);
            } else {
                this.animateRaf = null;
            }
        };
        this.animateRaf = requestAnimationFrame(tick);
    };

    private scrollByPage = (direction: 1 | -1): void => {
        const node = this.scrollRef.current;
        if (!node) return;
        const target = node.scrollLeft + direction * node.clientWidth * SCROLL_PAGE_RATIO;
        this.animateScrollTo(target);
    };

    private handlePrev = (): void => this.scrollByPage(-1);
    private handleNext = (): void => this.scrollByPage(1);

    private recordVelocity = (clientX: number): void => {
        const now = performance.now();
        this.velocitySamples.push({ time: now, x: clientX });
        const cutoff = now - MOMENTUM_TIME_WINDOW;
        while (this.velocitySamples.length > 0 && this.velocitySamples[0].time < cutoff) {
            this.velocitySamples.shift();
        }
    };

    private computeVelocity = (): number => {
        if (this.velocitySamples.length < 2) return 0;
        const first = this.velocitySamples[0];
        const last = this.velocitySamples[this.velocitySamples.length - 1];
        const dt = last.time - first.time;
        if (dt <= 0) return 0;
        return (last.x - first.x) / dt;
    };

    private startMomentum = (initialVelocity: number): void => {
        const node = this.scrollRef.current;
        if (!node) return;
        this.cancelMomentum();
        let velocity = initialVelocity;
        let lastTime = performance.now();
        const tick = (now: number): void => {
            const dt = now - lastTime;
            lastTime = now;
            const decay = Math.pow(MOMENTUM_DECAY, dt / 16.67);
            velocity *= decay;
            if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY) {
                this.momentumRaf = null;
                return;
            }
            const next = node.scrollLeft - velocity * dt;
            const max = node.scrollWidth - node.clientWidth;
            const clamped = Math.max(0, Math.min(next, max));
            node.scrollLeft = clamped;
            if (clamped === 0 || clamped === max) {
                this.momentumRaf = null;
                return;
            }
            this.momentumRaf = requestAnimationFrame(tick);
        };
        this.momentumRaf = requestAnimationFrame(tick);
    };

    private handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
        if (event.pointerType === "touch") return;
        if (event.button !== 0 && event.pointerType === "mouse") return;
        const node = this.scrollRef.current;
        if (!node) return;
        const target = event.target as HTMLElement;
        if (target.closest("input, select, textarea, [data-no-drag]")) {
            return;
        }
        this.cancelAnimate();
        this.cancelMomentum();
        this.dragPointerId = event.pointerId;
        this.dragOriginX = event.clientX;
        this.dragOriginScrollLeft = node.scrollLeft;
        this.dragMoved = false;
        this.velocitySamples = [{ time: performance.now(), x: event.clientX }];
    };

    private handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        if (this.dragPointerId !== event.pointerId) return;
        const node = this.scrollRef.current;
        if (!node) return;
        const dx = event.clientX - this.dragOriginX;
        if (!this.dragMoved && Math.abs(dx) < DRAG_THRESHOLD) return;
        if (!this.dragMoved) {
            this.dragMoved = true;
            this.setState({ isDragging: true });
            try {
                node.setPointerCapture(event.pointerId);
            } catch {
                // ignore — capture is best-effort
            }
        }
        node.scrollLeft = this.dragOriginScrollLeft - dx;
        this.recordVelocity(event.clientX);
    };

    private handlePointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
        if (this.dragPointerId !== event.pointerId) return;
        const node = this.scrollRef.current;
        if (node?.hasPointerCapture(event.pointerId)) {
            node.releasePointerCapture(event.pointerId);
        }
        this.dragPointerId = null;
        if (this.dragMoved) {
            const velocity = this.computeVelocity();
            this.preventNextClick = true;
            this.setState({ isDragging: false });
            if (Math.abs(velocity) > MOMENTUM_KICK_THRESHOLD) {
                this.startMomentum(velocity);
            }
        }
        this.dragMoved = false;
        this.velocitySamples = [];
    };

    private handleClickCapture = (event: React.MouseEvent<HTMLDivElement>): void => {
        if (this.preventNextClick) {
            this.preventNextClick = false;
            event.stopPropagation();
            event.preventDefault();
        }
    };

    private handleDragStart = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
    };

    render(): ReactNode {
        const { children } = this.props;
        const { canScrollLeft, canScrollRight, isDragging } = this.state;
        return (
            <div className={styles["carousel"]}>
                <button
                    type="button"
                    className={className(styles["carousel__nav"], styles["carousel__nav--prev"], {
                        [styles["carousel__nav--visible"]]: canScrollLeft,
                    })}
                    onClick={this.handlePrev}
                    aria-label={this.locale.t("common", "carousel.prev")}
                    tabIndex={canScrollLeft ? 0 : -1}
                    aria-hidden={!canScrollLeft}
                >
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M10 12L6 8l4-4" />
                    </svg>
                </button>
                <div
                    ref={this.scrollRef}
                    className={className(styles["carousel__viewport"], {
                        [styles["carousel__viewport--dragging"]]: isDragging,
                    })}
                    onPointerDown={this.handlePointerDown}
                    onPointerMove={this.handlePointerMove}
                    onPointerUp={this.handlePointerEnd}
                    onPointerCancel={this.handlePointerEnd}
                    onClickCapture={this.handleClickCapture}
                    onDragStart={this.handleDragStart}
                >
                    {children}
                </div>
                <button
                    type="button"
                    className={className(styles["carousel__nav"], styles["carousel__nav--next"], {
                        [styles["carousel__nav--visible"]]: canScrollRight,
                    })}
                    onClick={this.handleNext}
                    aria-label={this.locale.t("common", "carousel.next")}
                    tabIndex={canScrollRight ? 0 : -1}
                    aria-hidden={!canScrollRight}
                >
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M6 4l4 4-4 4" />
                    </svg>
                </button>
            </div>
        );
    }
}
