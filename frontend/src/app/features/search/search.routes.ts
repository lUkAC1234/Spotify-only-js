import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const searchRoutes: RouteObject[] = [
    {
        path: "search",
        Component: lazyLoaded(Lazy.Named(() => import("./search"), "Search")),
    },
];
