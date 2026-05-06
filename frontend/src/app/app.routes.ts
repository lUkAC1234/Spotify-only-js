import { RouteObject } from "react-router";

import { errorRoutes } from "./features/404/404.routes";
import { homeRoutes } from "./features/home/home.routes";
import { RouteErrorBoundary } from "./shared/ui/error/route-error-boundary";
import { Layouts } from "./shared/ui/layout/layouts";

export const routes: RouteObject[] = [
    {
        id: "landing-routes",
        ErrorBoundary: RouteErrorBoundary,
        Component: Layouts.Landing,
        children: [{ path: "", children: homeRoutes }],
    },
    ...errorRoutes,
];
