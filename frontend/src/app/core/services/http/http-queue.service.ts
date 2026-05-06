import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { inject, injectable } from "@/app/shared/decorators/di";

import { DisposableService } from "../disposable-stack.service";

export type HttpQueueState = "loading" | "loaded";

export type HttpQueueObject = {
    state: HttpQueueState;
    progress: number;
};

@injectable()
export class HttpQueue {
    private disposable: DisposableService = inject(DisposableService);

    @observable httpMap: Map<string, HttpQueueObject> = new Map();

    @computed
    get httpMapList(): [string, HttpQueueObject][] {
        return Array.from(this.httpMap.entries());
    }

    constructor() {
        makeObservable(this);
    }

    init(): void {
        const id = setInterval(() => {
            for (const [key, { state }] of this.httpMap.entries()) {
                if (state === "loaded") {
                    runInAction(() => {
                        this.httpMap.delete(key);
                    });
                }
            }
        }, 25000);

        this.disposable.register("interval-checker", () => clearInterval(id));
    }

    dispose(): void {
        this.disposable.dispose();
    }

    @action.bound
    setQueue(key: string, object: HttpQueueObject): void {
        this.httpMap.set(key, object);

        if (object.state === "loaded") {
            setTimeout(() => {
                runInAction(() => {
                    this.httpMap.delete(key);
                });
            }, 300);
        }
    }
}
