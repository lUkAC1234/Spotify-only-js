import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const settingsRoutes: RouteObject[] = [
    {
        path: "settings",
        Component: lazyLoaded(Lazy.Named(() => import("./settings"), "Settings")),
    },
];
