import { observer } from "mobx-react";
import { Component, MouseEvent, ReactNode } from "react";

import { LayoutService } from "@/app/core/services/ui/layout.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import { NavLink } from "../link/nav-link";
import styles from "./button.module.scss";

export type ButtonType = "primary" | "secondary" | "transparent";

export type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    fullwidth?: boolean;
    linkUrl?: string;
    buttonType?: ButtonType;
    small?: boolean;
    rounded?: boolean;
    centered?: boolean;
    activeClass?: string;
    removeBgEffect?: boolean;
    noWrap?: boolean;
};

@observer
export class Button extends Component<Props> {
    layout: LayoutService = inject(LayoutService);

    get bgEffectIsEnabled(): boolean {
        const { removeBgEffect = false } = this.props;
        return !removeBgEffect;
    }

    get className(): string {
        const {
            fullwidth,
            buttonType = "primary",
            small,
            rounded = false,
            centered = true,
            removeBgEffect = false,
            noWrap = true,
        } = this.props;

        return className(styles["button"], {
            [styles["button--small"]]: this.layout.breakpoints.isMobile ? true : small,
            [styles["button--fullwidth"]]: fullwidth,
            [styles["button--rounded"]]: rounded,
            [styles["button--centered"]]: centered,
            [styles["button--secondary"]]: buttonType === "secondary",
            [styles["button--primary"]]: buttonType === "primary",
            [styles["button--no-bg-effect"]]: removeBgEffect,
            [styles["button--nowrap"]]: noWrap,
            [this.props.className]: !!this.props.className,
        });
    }

    handleMouseDown = (e: MouseEvent<HTMLElement>) => {
        if (!this.bgEffectIsEnabled) {
            this.props.onMouseDown?.(e as any);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        e.currentTarget.style.setProperty("--x", `${x}px`);
        e.currentTarget.style.setProperty("--y", `${y}px`);

        this.props.onMouseDown?.(e as any);
    };

    render(): ReactNode {
        const {
            children,
            className,
            buttonType,
            type = "button",
            small,
            linkUrl,
            rounded,
            fullwidth,
            centered,
            noWrap,
            activeClass,
            removeBgEffect,
            onMouseDown,
            ...rest
        } = this.props;

        const content = <span className={styles["button__text"]}>{children}</span>;

        return !linkUrl ? (
            <button className={this.className} type={type} onMouseDown={this.handleMouseDown} {...rest}>
                {content}
            </button>
        ) : (
            <NavLink
                to={linkUrl}
                onMouseDown={this.handleMouseDown}
                baseClass={this.className}
                activeClass={activeClass}
                {...(rest as any)}
            >
                {content}
            </NavLink>
        );
    }
}
