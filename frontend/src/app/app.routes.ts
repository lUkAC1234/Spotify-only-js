import { RouteObject } from "react-router";

import { errorRoutes } from "./features/404/404.routes";
import { authRoutes } from "./features/auth/auth.routes";
import { homeRoutes } from "./features/home/home.routes";
import { libraryRoutes } from "./features/library/library.routes";
import { searchRoutes } from "./features/search/search.routes";
import { settingsRoutes } from "./features/settings/settings.routes";
import { RouteErrorBoundary } from "./shared/ui/error/route-error-boundary";
import { Layouts } from "./shared/ui/layout/layouts";

export const routes: RouteObject[] = [
    {
        id: "shell-routes",
        ErrorBoundary: RouteErrorBoundary,
        Component: Layouts.Shell,
        children: [
            { path: "", children: homeRoutes },
            ...searchRoutes,
            ...libraryRoutes,
            ...settingsRoutes,
        ],
    },
    {
        id: "auth-routes",
        ErrorBoundary: RouteErrorBoundary,
        Component: Layouts.Auth,
        children: authRoutes,
    },
    ...errorRoutes,
];
