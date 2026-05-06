import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";

import { inject } from "@/app/shared/decorators/di";

import { NavigateService } from "../services/navigate.service";

export const NavigateMiddleware = (): ReactNode => {
    const navigate = useNavigate();

    useEffect(() => {
        const navigateService = inject(NavigateService);
        navigateService.setNavigateFunction(navigate);
    }, [navigate]);

    return null;
};
