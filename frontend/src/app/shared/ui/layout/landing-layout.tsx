import { Component, ReactNode } from "react";
import { Outlet } from "react-router";

import { _static } from "../../decorators/static";

@_static
export class LandingLayout extends Component {
    render(): ReactNode {
        return <Outlet />;
    }
}
