import { action, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

@injectable()
export class FriendsPanelService {
    @observable isOpen: boolean = false;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    open(): void {
        this.isOpen = true;
    }

    @action.bound
    close(): void {
        this.isOpen = false;
    }

    @action.bound
    toggle(): void {
        this.isOpen = !this.isOpen;
    }
}
