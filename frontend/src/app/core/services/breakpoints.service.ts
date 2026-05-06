import { computed, makeObservable } from "mobx";

import { WindowService } from "@/app/core/services/browser/window.service";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class BreakpointsService {
    window: WindowService = inject(WindowService);

    @computed
    get isMobile(): boolean {
        return this.window.width <= 639;
    }

    @computed
    get isTablet(): boolean {
        return this.window.width <= 1024;
    }

    @computed
    get isDesktop(): boolean {
        return this.window.width > 1024;
    }

    constructor() {
        makeObservable(this);
    }
}
