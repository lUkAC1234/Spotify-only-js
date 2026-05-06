import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { Navigate as NavigateReactRouterDom, NavigateProps, To } from "react-router";

import { NavLinkService } from "@/app/core/services/nav-link.service";
import { inject } from "@/app/shared/decorators/di";

import { parseTo } from "./wrappers";

@observer
export class Navigate extends Component<NavigateProps> {
    navLink: NavLinkService = inject(NavLinkService);

    get to(): To {
        return parseTo(this.props.to, this.navLink);
    }

    render(): ReactNode {
        const { to, ...rest } = this.props;
        return <NavigateReactRouterDom to={this.to} {...rest} />;
    }
}
