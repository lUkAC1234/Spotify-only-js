import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const authRoutes: RouteObject[] = [
    {
        path: "login",
        Component: lazyLoaded(Lazy.Named(() => import("./login/login"), "Login")),
    },
    {
        path: "register",
        Component: lazyLoaded(Lazy.Named(() => import("./register/register"), "Register")),
    },
];
