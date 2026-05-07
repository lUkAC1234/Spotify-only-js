import { RouteObject } from "react-router";

import { errorRoutes } from "./features/404/404.routes";
import { albumRoutes } from "./features/album/album.routes";
import { artistRoutes } from "./features/artist/artist.routes";
import { authRoutes } from "./features/auth/auth.routes";
import { homeRoutes } from "./features/home/home.routes";
import { legalRoutes } from "./features/legal/legal.routes";
import { libraryRoutes } from "./features/library/library.routes";
import { playlistRoutes } from "./features/playlist/playlist.routes";
import { searchRoutes } from "./features/search/search.routes";
import { settingsRoutes } from "./features/settings/settings.routes";
import { userRoutes } from "./features/user/user.routes";
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
            ...playlistRoutes,
            ...artistRoutes,
            ...albumRoutes,
            ...userRoutes,
            ...settingsRoutes,
            ...legalRoutes,
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
