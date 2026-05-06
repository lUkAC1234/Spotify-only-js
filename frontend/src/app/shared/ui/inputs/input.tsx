import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LayoutService } from "@/app/core/services/ui/layout.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./input.module.scss";

export type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    fullwidth?: boolean;
    rounded?: boolean;
    small?: boolean;
    medium?: boolean;
};

@observer
export class Input extends Component<Props> {
    layout: LayoutService = inject(LayoutService);

    get className(): string {
        const { fullwidth, rounded = false, small = false, medium = false } = this.props;
        return className(styles["input"], {
            [this.props.className ?? ""]: !!this.props.className,
            [styles["input--fullwidth"]]: fullwidth,
            [styles["input--rounded"]]: rounded,
            [styles["input--small"]]: small,
            [styles["input--medium"]]: this.layout.breakpoints.isMobile ? true : medium,
        });
    }

    render(): ReactNode {
        const { type = "text", className, fullwidth, rounded, small, medium, ...rest } = this.props;
        return <input type={type} className={this.className} {...rest} />;
    }
}
