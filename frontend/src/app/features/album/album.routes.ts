import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const albumRoutes: RouteObject[] = [
    {
        path: "album/:albumId",
        Component: lazyLoaded(Lazy.Named(() => import("./album"), "Album")),
    },
];
