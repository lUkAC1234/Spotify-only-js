import { action, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

@injectable()
export class ConnectionService {
    @observable isOnline: boolean = navigator.onLine;

    constructor() {
        makeObservable(this);
    }

    init(): void {
        window.addEventListener("online", this.setOnline);
        window.addEventListener("offline", this.setOffline);
    }

    dispose(): void {
        window.removeEventListener("online", this.setOnline);
        window.removeEventListener("offline", this.setOffline);
    }

    @action.bound
    setConnection(isOnline: boolean): void {
        this.isOnline = isOnline;
    }

    setOnline = (): void => {
        this.setConnection(true);
    };

    setOffline = (): void => {
        this.setConnection(false);
    };
}
