import { Children, Component, ReactElement, ReactNode, RefObject, cloneElement, createRef, isValidElement } from "react";

import { className } from "@/app/shared/utils/functions/className";
import { SVG_ChevronRight } from "@/app/shared/ui/svg/nav/svg-chevron-right";

import styles from "./menu.module.scss";
import { Popover } from "./popover";

interface Props {
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
    children: ReactNode;
    closeMenu?: () => void;
}

interface State {
    isOpen: boolean;
}

export class MenuSubmenu extends Component<Props, State> {
    state: State = { isOpen: false };

    private triggerRef: RefObject<HTMLButtonElement | null> = createRef();

    private toggle = (): void => {
        if (this.props.disabled) return;
        this.setState((prev) => ({ isOpen: !prev.isOpen }));
    };

    private close = (): void => {
        this.setState({ isOpen: false });
    };

    private closeAll = (): void => {
        this.close();
        if (this.props.closeMenu) this.props.closeMenu();
    };

    render(): ReactNode {
        const { label, icon, disabled, children } = this.props;
        const { isOpen } = this.state;

        const propagated = Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const element = child as ReactElement<{ closeMenu?: () => void; onSelect?: () => void }>;
            if (element.props && ("onSelect" in element.props || "href" in element.props)) {
                return cloneElement(element, { closeMenu: this.closeAll });
            }
            return element;
        });

        return (
            <li role="none" className={styles["item-wrap"]}>
                <button
                    type="button"
                    ref={this.triggerRef}
                    className={className(styles["item"], {
                        [styles["item--disabled"]]: disabled === true,
                        [styles["item--open"]]: isOpen,
                    })}
                    role="menuitem"
                    data-menu-item
                    data-disabled={disabled === true}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-disabled={disabled === true}
                    disabled={disabled === true}
                    onClick={this.toggle}
                >
                    {icon && <span className={styles["item__icon"]}>{icon}</span>}
                    <span className={styles["item__label"]}>{label}</span>
                    <span className={styles["item__chevron"]}>
                        <SVG_ChevronRight />
                    </span>
                </button>
                <Popover
                    isOpen={isOpen}
                    anchorRef={this.triggerRef}
                    placement="right-start"
                    onClose={this.close}
                    label={label}
                >
                    <ul className={styles["menu"]} role="menu" aria-label={label}>
                        {propagated}
                    </ul>
                </Popover>
            </li>
        );
    }
}
