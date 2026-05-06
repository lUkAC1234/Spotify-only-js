import { RouteObject } from "react-router";

import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { RouteErrorBoundary } from "@/app/shared/ui/error/route-error-boundary";
import { Layouts } from "@/app/shared/ui/layout/layouts";
import { Lazy } from "@/app/shared/utils/functions/lazy";

export const errorRoutes: RouteObject[] = [
    {
        id: "error-routes",
        path: "",
        ErrorBoundary: RouteErrorBoundary,
        Component: Layouts.Error,
        children: [
            {
                path: "*",
                Component: lazyLoaded(Lazy.Named(() => import("./404"), "Error404")),
            },
        ],
    },
];
