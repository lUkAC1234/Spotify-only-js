import { Component, ReactNode } from "react";

import { AppOutlet } from "./app-outlet";

export class ErrorLayout extends Component {
    render(): ReactNode {
        return <AppOutlet removeWrappers removePadding />;
    }
}
