import { action, autorun, computed, makeObservable, observable, reaction } from "mobx";
import { RefObject } from "react";

import { inject, injectable } from "@/app/shared/decorators/di";

import { DisposableService } from "../disposable-stack.service";

export interface ModalServiceOptions {
    disableEscape?: boolean;
    noTransition?: boolean;
}

@injectable({
    provideIn: "local",
})
export class ModalService {
    private disposable: DisposableService = inject(DisposableService);

    disableEscape: boolean = false;
    noTransition: boolean = false;

    @observable isActive: boolean = false;
    @observable width: string = "fit-content";
    @observable height: string = "fit-content";
    @observable componentRenderTrigger: number = 0;
    @observable modalRef: RefObject<HTMLDivElement | null> = observable.object({ current: null });

    @observable.ref componentClass: React.ComponentType<any> | null = null;
    @observable.ref previousComponentClass: React.ComponentType<any> | null = null;

    @computed
    get hasPreviousComponent(): boolean {
        return this.previousComponentClass !== null;
    }

    constructor(options?: ModalServiceOptions) {
        if (!!options) {
            this.construct(options);
        }
        makeObservable(this);
    }

    init(): void {
        this.disposable.register(
            "scrollbar-manage",
            autorun(() => {
                if (this.isActive) {
                    document.documentElement.classList.add("hide-scrollbar");
                } else {
                    document.documentElement.classList.remove("hide-scrollbar");
                }
            }),
        );

        this.disposable.register(
            "component-change",
            reaction(
                () => this.componentClass,
                (componentClass, prevComponentClass) => {
                    if (componentClass?.displayName !== prevComponentClass?.displayName) {
                        this.setPrevComponentClass(prevComponentClass);
                    }
                },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
    }

    construct(options: ModalServiceOptions): void {
        if (options?.disableEscape) this.disableEscape = true;
        if (options?.noTransition) this.noTransition = true;
    }

    @action.bound
    backToPrevious(): void {
        if (this.componentClass?.displayName !== this.previousComponentClass?.displayName) {
            this.componentClass = this.previousComponentClass;
            this.componentRenderTrigger++;
        }
    }

    @action.bound
    toggleWindow(v?: boolean): void {
        if (v === this.isActive) return;
        this.isActive = v ?? !this.isActive;
    }

    @action.bound
    setWidth(width: number | string, important?: boolean): void {
        if (important) {
            this.width = width + " !important";
        }
        this.width = typeof width === "number" ? `${width}px` : width;
    }

    @action.bound
    setHeight(height: number | string, important?: boolean): void {
        if (important) {
            this.height = height + " !important";
        }
        this.height = typeof height === "number" ? `${height}px` : height;
    }

    @action.bound
    setPrevComponentClass<T>(componentClass: React.ComponentType<T> | null): void {
        this.previousComponentClass = componentClass;
    }

    @action.bound
    setComponentClass<T>(componentClass: React.ComponentType<T> | null): void {
        this.componentClass = componentClass;
        this.componentRenderTrigger++;
    }

    @action.bound
    setModalRef(ref: RefObject<HTMLDivElement | null>): void {
        this.modalRef = ref;
    }
}
