import { action, computed, makeObservable, observable, ObservableMap } from "mobx";

import { injectable } from "@/app/shared/decorators/di";
import { uniqueIdGenerator } from "@/app/shared/utils/functions/uniqueIdGenerator";

export type AlertType = "info" | "success" | "warning" | "error";

export interface AlertMessage {
    message: string;
    title?: string;
    type?: AlertType;
    delay?: number;
}

export interface AlertEntry {
    hash: string;
    message: string;
    title?: string;
    type: AlertType;
    delay: number;
}

const DEFAULT_DELAY_MS = 4500;

type AlertHandle = { hash: string; delete: () => void };
type AlertOptions = Partial<Omit<AlertMessage, "type" | "message">>;

@injectable()
export class AlertService {
    @observable private readonly alerts: ObservableMap<string, AlertEntry> = observable.map([]);
    private readonly timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    @computed
    get alertsList(): AlertEntry[] {
        return Array.from(this.alerts.values());
    }

    @computed
    get alertIsActive(): boolean {
        return this.alerts.size > 0;
    }

    constructor() {
        makeObservable(this);
    }

    @action.bound
    pushAlert(alertMsg: AlertMessage): AlertHandle {
        const hash: string = this.getNewHash();
        const entry: AlertEntry = {
            hash,
            message: alertMsg.message,
            title: alertMsg.title,
            type: alertMsg.type ?? "info",
            delay: alertMsg.delay ?? DEFAULT_DELAY_MS,
        };
        this.alerts.set(hash, entry);

        if (entry.delay > 0) {
            const timer = setTimeout(() => this.deleteAlert(hash), entry.delay);
            this.timers.set(hash, timer);
        }

        return {
            hash,
            delete: () => this.deleteAlert(hash),
        };
    }

    @action.bound
    success(message: string, options?: AlertOptions): AlertHandle {
        return this.pushAlert({ ...options, message, type: "success" });
    }

    @action.bound
    error(message: string, options?: AlertOptions): AlertHandle {
        return this.pushAlert({ ...options, message, type: "error" });
    }

    @action.bound
    warning(message: string, options?: AlertOptions): AlertHandle {
        return this.pushAlert({ ...options, message, type: "warning" });
    }

    @action.bound
    info(message: string, options?: AlertOptions): AlertHandle {
        return this.pushAlert({ ...options, message, type: "info" });
    }

    @action.bound
    deleteAlert(hash: string): void {
        const timer = this.timers.get(hash);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(hash);
        }
        this.alerts.delete(hash);
    }

    private getNewHash(): string {
        return uniqueIdGenerator(15, {
            includeNum: true,
            upperCaseMixed: true,
        });
    }
}
