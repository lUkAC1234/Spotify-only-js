import { action, makeObservable, observable, ObservableMap } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

export type ApiMap = "/contact-requests" | "/equipment" | "/team";

const API_MAP: Array<[ApiMap, string]> = [
    ["/contact-requests", "/api/contact-requests/"],
    ["/equipment", "/api/equipment/"],
    ["/team", "/api/team/"],
];

@injectable()
export class ApiService {
    @observable api_map: ObservableMap<ApiMap, string> = observable.map(API_MAP);

    get origin(): string {
        return import.meta.env.VITE_API_ORIGIN;
    }

    constructor() {
        makeObservable(this);
    }

    get = (endpoint: ApiMap, id?: number | string, addSlash?: boolean): string | null => {
        let url = this.api_map.get(endpoint);
        if (url) {
            url = `${this.origin}${url}${id ? `${id}${addSlash ? "/" : ""}` : ""}`;
        }

        return url ?? null;
    };

    @action.bound
    setApiMap(apiMap: ObservableMap<ApiMap, string>) {
        this.api_map = apiMap;
    }
}
