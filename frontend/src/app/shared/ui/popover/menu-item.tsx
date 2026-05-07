import { Component, ReactNode } from "react";

import { className } from "@/app/shared/utils/functions/className";
import { SVG_ChevronRight } from "@/app/shared/ui/svg/nav/svg-chevron-right";

import styles from "./menu.module.scss";

interface Props {
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
    danger?: boolean;
    hasSubmenu?: boolean;
    href?: string;
    onSelect?: () => void;
    closeMenu?: () => void;
}

export class MenuItem extends Component<Props> {
    private handleClick = (): void => {
        if (this.props.disabled) return;
        if (this.props.onSelect) this.props.onSelect();
        if (!this.props.hasSubmenu && this.props.closeMenu) this.props.closeMenu();
    };

    render(): ReactNode {
        const { label, icon, disabled, danger, hasSubmenu, href } = this.props;
        const cls = className(styles["item"], {
            [styles["item--disabled"]]: disabled === true,
            [styles["item--danger"]]: danger === true,
        });
        const inner: ReactNode = (
            <>
                {icon && <span className={styles["item__icon"]}>{icon}</span>}
                <span className={styles["item__label"]}>{label}</span>
                {hasSubmenu && (
                    <span className={styles["item__chevron"]}>
                        <SVG_ChevronRight />
                    </span>
                )}
            </>
        );

        if (href !== undefined) {
            return (
                <li role="none" className={styles["item-wrap"]}>
                    <a
                        className={cls}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        data-menu-item
                        data-disabled={disabled === true}
                        onClick={this.handleClick}
                        aria-disabled={disabled === true}
                    >
                        {inner}
                    </a>
                </li>
            );
        }

        return (
            <li role="none" className={styles["item-wrap"]}>
                <button
                    type="button"
                    className={cls}
                    role="menuitem"
                    data-menu-item
                    data-disabled={disabled === true}
                    aria-haspopup={hasSubmenu === true ? "menu" : undefined}
                    aria-disabled={disabled === true}
                    disabled={disabled === true}
                    onClick={this.handleClick}
                >
                    {inner}
                </button>
            </li>
        );
    }
}
