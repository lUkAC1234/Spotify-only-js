import { Component, ReactNode } from "react";
import { Outlet } from "react-router";

import { Middlewares } from "@/app/core/providers/middlewares";
import { Portals } from "@/app/core/providers/portals";
import { inject } from "@/app/shared/decorators/di";
import { AlertRoot } from "@/app/shared/ui/alerts/alert";

import { AppService } from "./app.service";
import { _static } from "./shared/decorators/static";

@_static
export class App extends Component {
    appService: AppService = inject(AppService);

    componentDidMount(): void {
        this.appService.init();
    }

    componentWillUnmount(): void {
        this.appService.dispose();
    }

    render(): ReactNode {
        return (
            <>
                <Middlewares />
                <Portals />
                <AlertRoot />
                <Outlet />
            </>
        );
    }
}
