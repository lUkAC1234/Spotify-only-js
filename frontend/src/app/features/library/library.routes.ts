import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const libraryRoutes: RouteObject[] = [
    {
        path: "library",
        Component: lazyLoaded(Lazy.Named(() => import("./library"), "Library")),
    },
];
