import { action, computed, makeObservable, observable, reaction } from "mobx";
import { createRef, RefObject } from "react";

import { inject, injectable } from "@/app/shared/decorators/di";

import { BreakpointsService } from "../breakpoints.service";
import { DisposableService } from "../disposable-stack.service";

export const NAV_LAYOUT_STYLE = "nav-layout-style";
export const SIDEBAR_COLLAPSE_OVERRIDE = "sidebar-collapse-override";

export type NavLayoutStyle = "header" | "sidebar";

const readCollapseOverride = (): boolean | null => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSE_OVERRIDE);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return null;
};

@injectable()
export class LayoutService {
    breakpoints: BreakpointsService = inject(BreakpointsService);
    private disposable: DisposableService = inject(DisposableService);

    @observable sidebarIsMobileForce: boolean = false;
    @observable sidebarIsActive: boolean = false;
    @observable sidebarCollapseOverride: boolean | null = readCollapseOverride();
    @observable.ref mainRef: RefObject<HTMLElement | null> = createRef();
    @observable.ref mainWrapRef: RefObject<HTMLDivElement | null> = createRef();
    @observable navLayout: NavLayoutStyle = (localStorage.getItem(NAV_LAYOUT_STYLE) as NavLayoutStyle) || "sidebar";

    @computed
    get sidebarIsMobile(): boolean {
        return this.breakpoints.isMobile || this.sidebarIsMobileForce;
    }

    @computed
    get sidebarIsCollapsed(): boolean {
        if (this.breakpoints.isMobile) return false;
        if (this.sidebarCollapseOverride !== null) return this.sidebarCollapseOverride;
        return this.breakpoints.isTablet;
    }

    constructor() {
        makeObservable(this);
    }

    init(): void {
        this.disposable.register(
            "nav-layout",
            reaction(
                () => this.navLayout,
                (navLayout) => localStorage.setItem(NAV_LAYOUT_STYLE, navLayout),
            ),
        );

        this.disposable.register(
            "sidebar-collapse-override",
            reaction(
                () => this.sidebarCollapseOverride,
                (value) => {
                    if (value === null) {
                        localStorage.removeItem(SIDEBAR_COLLAPSE_OVERRIDE);
                    } else {
                        localStorage.setItem(SIDEBAR_COLLAPSE_OVERRIDE, String(value));
                    }
                },
            ),
        );

        this.disposable.register(
            "resize",
            reaction(
                () => this.breakpoints.isMobile,
                (isMobile) => {
                    if (isMobile && this.sidebarIsActive) {
                        this.closeSidebar();
                    }
                },
            ),
        );

        this.disposable.register(
            "sidebar-status",
            reaction(
                () => this.sidebarIsActive,
                (isActive) => {
                    if (this.breakpoints.isMobile) {
                        document.body.classList[isActive ? "add" : "remove"]("hide-scrollbar");
                    }
                },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
    }

    @action.bound
    setHeader(): void {
        this.navLayout = "header";
    }

    @action.bound
    setSidebar(): void {
        this.navLayout = "sidebar";
    }

    @action.bound
    toggleSidebar(): void {
        this.sidebarIsActive = !this.sidebarIsActive;
    }

    @action.bound
    closeSidebar(): void {
        this.sidebarIsActive = false;
    }

    @action.bound
    openSidebar(): void {
        this.sidebarIsActive = true;
    }

    @action.bound
    setMobile(v: boolean): void {
        this.sidebarIsMobileForce = v;
    }

    @action.bound
    toggleSidebarCollapsed(): void {
        this.sidebarCollapseOverride = !this.sidebarIsCollapsed;
    }
}
