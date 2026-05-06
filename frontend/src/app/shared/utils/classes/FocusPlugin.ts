import { ReactAppPlugin } from "./ReactPlugin";

export class FocusModule {
    init(): void {
        document.addEventListener("keydown", this.keydownHandler);
    }

    dispose(): void {
        document.removeEventListener("keydown", this.keydownHandler);
    }

    keydownHandler = (evt: KeyboardEvent): void => {
        const key: string = evt.key;
        if (key !== "Escape") return;

        const activeElement: HTMLElement = document.activeElement as HTMLElement;
        if (activeElement) {
            activeElement?.blur?.();
        }
    };
}

export class FocusPlugin extends ReactAppPlugin<FocusModule> {
    constructor() {
        super(FocusModule);
    }

    setup(): void {
        this.plugin.init();
    }

    dispose(): void {
        this.plugin.dispose();
    }
}
