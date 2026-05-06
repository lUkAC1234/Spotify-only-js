import { action, computed, makeObservable, observable, ObservableMap } from "mobx";

import { injectable } from "@/app/shared/decorators/di";
import { uniqueIdGenerator } from "@/app/shared/utils/functions/uniqueIdGenerator";

export interface IAlert {
    hash: string;
    message: string;
}

export type AlertMessage = {
    message: string;
    delay?: number;
};

@injectable()
export class AlertService {
    @observable private readonly alerts: ObservableMap<string, AlertMessage> = observable.map([]);

    @computed
    get alertsList(): Array<[string, AlertMessage]> {
        return Array.from(this.alerts.entries());
    }

    @computed
    get alertIsActive(): boolean {
        return this.alertsList.length > 0;
    }

    constructor() {
        makeObservable(this);
    }

    @action.bound
    pushAlert(alertMsg: AlertMessage) {
        const { message, delay } = alertMsg;
        const hash: string = this.getNewHash();
        this.alerts.set(hash, {
            message,
            delay,
        });

        if (delay) {
            setTimeout(() => {
                this.deleteAlert(hash);
            }, delay);
        }

        return {
            hash,
            delete: () => {
                this.deleteAlert(hash);
            },
            deleteDelayed: (delay: number) => {
                setTimeout(() => {
                    this.deleteAlert(hash);
                }, delay);
            },
        };
    }

    @action.bound
    deleteAlert(hash: string): void {
        this.alerts.delete(hash);
    }

    private getNewHash(): string {
        return uniqueIdGenerator(15, {
            includeNum: true,
            upperCaseMixed: true,
        });
    }
}
