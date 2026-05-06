import { Component, ComponentType, Fragment, ReactNode } from "react";

import { _static } from "@/app/shared/decorators/static";

import { LanguageMiddleware } from "../middlewares/language-middleware";
import { LocationMiddleware } from "../middlewares/location-middleware";
import { NavigateMiddleware } from "../middlewares/navigate-middleware";

type Middleware = {
    id: string;
    Component: ComponentType<any>;
    include?: boolean;
};

const middlewares: Middleware[] = [
    {
        id: "navigate-middleware",
        Component: NavigateMiddleware,
    },
    {
        id: "location-middleware",
        Component: LocationMiddleware,
    },
    {
        id: "language-middleware",
        Component: LanguageMiddleware,
    },
];

@_static
export class Middlewares extends Component {
    render(): ReactNode {
        return middlewares.map(
            ({ id, Component, include = true }) =>
                include === true && (
                    <Fragment key={id}>
                        <Component />
                    </Fragment>
                ),
        );
    }
}
