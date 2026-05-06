import { observer } from "mobx-react";
import { Component, ReactNode, RefObject } from "react";
import { NavLink as ReactRouterNavLink, NavLinkProps, To } from "react-router";

import { NavLinkService } from "@/app/core/services/nav-link.service";
import { inject } from "@/app/shared/decorators/di";

import { className } from "../../utils/functions/className";
import { activeClassNameObserver } from "../../utils/functions/nav-links";
import { parseTo } from "./wrappers";

export type Props = NavLinkProps & {
    navRef?: RefObject<HTMLAnchorElement>;
    baseClass?: string;
    activeClass?: string;
};

@observer
export class NavLink extends Component<Props> {
    navLink: NavLinkService = inject(NavLinkService);

    get to(): To {
        return parseTo(this.props.to, this.navLink);
    }

    get baseClass(): string {
        const isString: boolean = typeof this.props.className === "string";
        return className(this.props.baseClass, {
            [isString ? (this.props.className as string) : ""]: isString,
        });
    }

    render(): ReactNode {
        const { to, baseClass, activeClass, navRef, ...rest } = this.props;
        const pathname: string = typeof to === "string" ? to : to.pathname;

        return (
            <ReactRouterNavLink
                to={this.to}
                ref={navRef}
                className={() => activeClassNameObserver(pathname, this.baseClass, activeClass)}
                {...rest}
            />
        );
    }
}
