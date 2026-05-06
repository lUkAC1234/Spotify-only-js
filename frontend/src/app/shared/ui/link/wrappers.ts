import { To } from "react-router";

import { NavLinkService } from "@/app/core/services/nav-link.service";

export function parseTo(to: To, navLink: NavLinkService): string | To {
    if (typeof to === "string") {
        return navLink.buildUrl(to);
    }

    if (typeof to === "object" && to.pathname) {
        return {
            ...to,
            pathname: navLink.buildUrl(to.pathname),
        };
    }

    return to;
}
