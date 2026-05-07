import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const legalRoutes: RouteObject[] = [
    {
        path: "legal",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Legal")),
    },
    {
        path: "safety",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Safety")),
    },
    {
        path: "privacy",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Privacy")),
    },
    {
        path: "cookies",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Cookies")),
    },
    {
        path: "ads",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Ads")),
    },
    {
        path: "accessibility",
        Component: lazyLoaded(Lazy.Named(() => import("./legal"), "Accessibility")),
    },
];
