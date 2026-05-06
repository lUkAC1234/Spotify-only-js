import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./textarea.module.scss";

export type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    fullwidth?: boolean;
    rounded?: boolean;
    dark?: boolean;
};

@observer
export class Textarea extends Component<Props> {
    get className(): string {
        const { fullwidth, rounded = false, dark } = this.props;
        return className(styles["textarea"], {
            [this.props.className ?? ""]: !!this.props.className,
            [styles["textarea--fullwidth"]]: fullwidth,
            [styles["textarea--rounded"]]: rounded,
            [styles["textarea--dark"]]: dark,
        });
    }

    render(): ReactNode {
        const { className, fullwidth, rounded, rows = 7, dark, ...rest } = this.props;
        return <textarea className={this.className} rows={rows} {...rest}></textarea>;
    }
}
