import { action, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";

@injectable()
export class WindowService {
    @observable width: number = window.innerWidth;
    @observable height: number = window.innerHeight;
    @observable scrollX: number = window.scrollX;
    @observable scrollY: number = window.scrollY;
    @observable isOnline: boolean = navigator.onLine;
    @observable isVisible: boolean = document.visibilityState === "visible";
    @observable hasFocus: boolean = document.hasFocus();

    constructor() {
        makeObservable(this);
    }

    init(): void {
        window.addEventListener("resize", this.handleResize);
        window.addEventListener("scroll", this.handleScroll, { passive: true });
        window.addEventListener("online", this.handleOnline);
        window.addEventListener("offline", this.handleOffline);
        document.addEventListener("visibilitychange", this.handleVisibility);
        window.addEventListener("focus", this.handleFocus);
        window.addEventListener("blur", this.handleBlur);
    }

    dispose(): void {
        window.removeEventListener("resize", this.handleResize);
        window.removeEventListener("scroll", this.handleScroll);
        window.removeEventListener("online", this.handleOnline);
        window.removeEventListener("offline", this.handleOffline);
        document.removeEventListener("visibilitychange", this.handleVisibility);
        window.removeEventListener("focus", this.handleFocus);
        window.removeEventListener("blur", this.handleBlur);
    }

    @action.bound
    handleResize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    @action.bound
    private updateScroll() {
        this.scrollX = window.scrollX;
        this.scrollY = window.scrollY;
    }

    handleScroll = debounce(() => {
        this.updateScroll();
    }, 50);

    @action.bound
    handleOnline(): void {
        this.isOnline = true;
    }

    @action.bound
    handleOffline(): void {
        this.isOnline = false;
    }

    @action.bound
    handleVisibility(): void {
        this.isVisible = document.visibilityState === "visible";
    }

    @action.bound
    handleFocus(): void {
        this.hasFocus = true;
    }

    @action.bound
    handleBlur(): void {
        this.hasFocus = false;
    }
}
