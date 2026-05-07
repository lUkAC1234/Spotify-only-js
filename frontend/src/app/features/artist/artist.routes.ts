import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const artistRoutes: RouteObject[] = [
    {
        path: "artist/:artistId",
        Component: lazyLoaded(Lazy.Named(() => import("./artist"), "Artist")),
    },
];
