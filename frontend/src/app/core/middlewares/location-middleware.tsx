import { ReactNode, useEffect } from "react";
import { Location, useLocation } from "react-router";

import { inject } from "@/app/shared/decorators/di";

import { LocationService } from "../services/location.service";

export const LocationMiddleware = (): ReactNode => {
    const location: Location = useLocation();

    useEffect(() => {
        const locationService = inject(LocationService);

        if (!locationService) return;

        const isDifferent =
            locationService.location.pathname !== location.pathname ||
            locationService.location.search !== location.search;

        if (isDifferent) {
            locationService.setLocation(location);
        }
    }, [location]);

    return null;
};
