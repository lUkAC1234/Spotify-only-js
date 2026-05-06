import { reaction } from "mobx";
import { ReactNode, useEffect } from "react";
import { Location, NavigateFunction, useLocation, useNavigate } from "react-router";

import { inject } from "@/app/shared/decorators/di";

import { router } from "../providers/router";
import { LocaleService } from "../services/locale.service";

export const LanguageMiddleware = (): ReactNode => {
    const navigate: NavigateFunction = useNavigate();
    const location: Location<any> = useLocation();

    const getPathInfo = (pathname: string) => {
        const locale: LocaleService = inject(LocaleService);
        if (!locale) return;

        const parts = pathname.split("/").filter(Boolean);
        const firstSegment = parts[0];

        const prefixLangs = locale.langs.filter((l) => l !== locale.defaultLang);
        const isLangInUrl = prefixLangs.includes(firstSegment);

        const cleanPath = isLangInUrl ? `/${parts.slice(1).join("/")}` : `/${parts.join("/")}`;

        return { firstSegment, isLangInUrl, cleanPath };
    };

    useEffect(() => {
        const locale: LocaleService = inject(LocaleService);

        const dispose = reaction(
            () => locale.lang,
            (newLang) => {
                const pathInfo = getPathInfo(location.pathname);
                if (!pathInfo) return;

                const { isLangInUrl, cleanPath, firstSegment } = pathInfo;
                const isDefault = newLang === locale.defaultLang;

                const expectedPrefix = isDefault ? "" : `/${newLang}`;
                const currentPrefix = isLangInUrl ? `/${firstSegment}` : "";

                const appRoute = router.routes.find((route) => route.id === "app-route");
                if (isDefault) appRoute.path = "";
                else appRoute.path = "/:lang";

                if (currentPrefix !== expectedPrefix) {
                    const target = isDefault
                        ? cleanPath === "/"
                            ? "/"
                            : cleanPath
                        : `${expectedPrefix}${cleanPath === "/" ? "" : cleanPath}`;

                    navigate(target, { replace: true });
                }
            },
        );

        return () => dispose();
    }, [location.pathname]);

    useEffect(() => {
        const locale: LocaleService = inject(LocaleService);
        if (!locale) return;

        const pathInfo = getPathInfo(location.pathname);
        if (!pathInfo) return;

        const { isLangInUrl, firstSegment, cleanPath } = pathInfo;
        const detectedLang = isLangInUrl ? firstSegment : locale.defaultLang;
        const appRoute = router.routes.find((route) => route.id === "app-route");

        let routeMutated = false;

        if (detectedLang === locale.defaultLang && appRoute.path !== "") {
            appRoute.path = "";
            routeMutated = true;
        } else if (detectedLang !== locale.defaultLang && appRoute.path !== "/:lang") {
            appRoute.path = "/:lang";
            routeMutated = true;
        }

        if (locale.lang !== detectedLang) {
            locale.setLocale(detectedLang);
        }

        if (firstSegment === locale.defaultLang) {
            navigate(cleanPath === "/" ? "/" : cleanPath, { replace: true });
            return;
        }

        if (routeMutated) {
            navigate(location.pathname + location.search, { replace: true });
        }
    }, [location.pathname]);

    return null;
};
