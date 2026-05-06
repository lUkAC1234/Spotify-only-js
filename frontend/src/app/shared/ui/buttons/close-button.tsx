import { CSSProperties, PureComponent, ReactNode } from "react";

import { PropsWithClassName } from "@/app/shared/types/react-types";
import { className } from "@/app/shared/utils/functions/className";

import { SVG_CloseIcon } from "../svg/svg-close-icon";
import styles from "./close-button.module.scss";

export type Props = PropsWithClassName & {
    position?: "absolute" | "fixed";
    alignX?: "left" | "right";
    alignY?: "top" | "bottom";
    style?: CSSProperties;
    onClick?: (evt: React.MouseEvent<HTMLButtonElement>) => void;
};

export class CloseButton extends PureComponent<Props> {
    get closeButtonClassName(): string {
        const { position, alignX, alignY } = this.props;
        return className(styles["close-button"], {
            [this.getCloseBtnAlignClassName("left")]: alignX === "left",
            [this.getCloseBtnAlignClassName("right")]: alignX === "right",
            [this.getCloseBtnAlignClassName("bottom")]: alignY === "bottom",
            [this.getCloseBtnAlignClassName("top")]: alignY === "top",
            [this.getCloseBtnAlignClassName("absolute")]: position === "absolute",
            [this.getCloseBtnAlignClassName("fixed")]: position === "fixed",
            [this.props.className]: Boolean(this.props.className),
        });
    }

    getCloseBtnAlignClassName(align: "left" | "right" | "top" | "bottom" | "absolute" | "fixed"): string {
        return styles[`close-button--${align}`];
    }

    render(): ReactNode {
        return (
            <button
                type="button"
                className={this.closeButtonClassName}
                style={this.props.style}
                onClick={this.props.onClick}
            >
                <SVG_CloseIcon className={styles["close-button__svg"]} />
            </button>
        );
    }
}
