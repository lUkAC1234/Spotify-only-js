import { Component, ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";

import { inject } from "@/app/shared/decorators/di";
import { _static } from "@/app/shared/decorators/static";
import { InternetState } from "@/app/shared/ui/internet-state/internet-state";
import { LoadingLine } from "@/app/shared/ui/loaders/loading-line";

import { ModalsService } from "../services/ui/modals.service";
import { Modals } from "./modals";

type Portal = {
    id: string;
    root: HTMLElement;
    Component: ComponentType<any>;
};

const portals: Portal[] = [
    {
        id: "loading-line",
        root: document.body,
        Component: LoadingLine,
    },
    {
        id: "internet-state",
        root: document.body,
        Component: InternetState,
    },
    {
        id: "modals",
        root: document.body,
        Component: Modals,
    },
];

@_static
export class Portals extends Component {
    modals: ModalsService = inject(ModalsService);

    render(): ReactNode {
        return portals.map(({ id, root, Component }) => createPortal(<Component />, root, id));
    }
}
