import { Component, ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";

import { routes } from "@/app/app.routes";
import { inject } from "@/app/shared/decorators/di";
import { _static } from "@/app/shared/decorators/static";
import { lazyLoaded } from "@/app/shared/hocs/lazy-loaded";
import { ErrorBoundary } from "@/app/shared/ui/error/error-boundary";
import { Lazy } from "@/app/shared/utils/functions/lazy";

import { LocaleService } from "../services/locale.service";

const locale: LocaleService = inject(LocaleService);

export const router = createBrowserRouter([
    {
        id: "app-route",
        path: locale.isDefaultLang ? "" : "/:lang?",
        Component: lazyLoaded(Lazy.Named(() => import("@/app/app"), "App")),
        children: routes,
    },
]);

@_static
export class AppRouter extends Component {
    render(): ReactNode {
        return (
            <ErrorBoundary>
                <RouterProvider router={router} />
            </ErrorBoundary>
        );
    }
}
