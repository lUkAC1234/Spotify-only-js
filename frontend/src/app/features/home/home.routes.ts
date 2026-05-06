import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const homeRoutes: RouteObject[] = [
    {
        path: "",
        Component: lazyLoaded(Lazy.Named(() => import("./home"), "Home")),
    },
];
