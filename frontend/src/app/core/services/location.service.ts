import { action, computed, makeObservable, observable } from "mobx";
import { Location } from "react-router";

import { inject, injectable } from "@/app/shared/decorators/di";
import { uniqueIdGenerator } from "@/app/shared/utils/functions/uniqueIdGenerator";

import { LocaleService } from "./locale.service";

type CustomLocation = Pick<Location, "hash" | "key" | "pathname" | "search" | "state">;

@injectable()
export class LocationService {
    private readonly locale: LocaleService = inject(LocaleService);

    @observable.ref location: CustomLocation = {
        hash: window.location.hash,
        key: uniqueIdGenerator(15),
        pathname: window.location.pathname,
        search: window.location.search,
        state: window.history.state,
    };

    @computed
    get currentPath(): string {
        const splitted = this.location.pathname.split("/").filter(Boolean);

        if (this.locale.isDefaultLang) {
            return splitted.join("/");
        }

        const [_lng, ...rest] = splitted;
        return rest.join("/");
    }

    constructor() {
        makeObservable(this);
    }

    @action.bound
    setLocation(location: Location): void {
        this.location = location;
    }
}
