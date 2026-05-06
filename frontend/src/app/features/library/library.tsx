import { Component, ReactNode } from "react";

import { ComingSoon } from "@/app/shared/ui/coming-soon/coming-soon";

export class Library extends Component {
    render(): ReactNode {
        return <ComingSoon phase={7} titleKey="nav.library" />;
    }
}
