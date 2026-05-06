import { action, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

@injectable()
export class ErrorBoundaryService {
    @observable throwenError: boolean = false;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    setErrorStatus(yes: boolean, callback?: () => void): void {
        this.throwenError = yes;
        callback?.();
    }
}
