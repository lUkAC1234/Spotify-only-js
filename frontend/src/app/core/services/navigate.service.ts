import { NavigateFunction, NavigateOptions, To } from "react-router";

import { inject, injectable } from "@/app/shared/decorators/di";

import { NavLinkService } from "./nav-link.service";

export type NavigateServiceOptions = NavigateOptions & {
    navigate?: NavigateFunction;
};

@injectable()
export class NavigateService {
    private _navigate: NavigateFunction;
    private navLink: NavLinkService = inject(NavLinkService);

    navigate = (to: To, options?: NavigateServiceOptions) => {
        const url = to.toString();
        const finalUrl = this.navLink.buildUrl(url);
        if (typeof options?.navigate === "function") this._navigate = options?.navigate;
        this._navigate(finalUrl, options);
    };

    setNavigateFunction = (navigate: NavigateFunction): void => {
        this._navigate = navigate;
    };
}
