import { Children, Component, KeyboardEvent, ReactElement, ReactNode, cloneElement, createRef, isValidElement } from "react";

import styles from "./menu.module.scss";

interface Props {
    children: ReactNode;
    label?: string;
    onClose?: () => void;
}

interface State {
    activeIndex: number;
}

export class Menu extends Component<Props, State> {
    state: State = { activeIndex: 0 };

    private listRef = createRef<HTMLUListElement>();

    componentDidMount(): void {
        const items = this.collectItems();
        if (items.length > 0) {
            const first = items[0];
            requestAnimationFrame(() => first.focus());
        }
    }

    private collectItems = (): HTMLButtonElement[] => {
        const list = this.listRef.current;
        if (!list) return [];
        return Array.from(list.querySelectorAll<HTMLButtonElement>("[data-menu-item]:not([data-disabled='true'])"));
    };

    private focusItem = (index: number): void => {
        const items = this.collectItems();
        if (items.length === 0) return;
        const next = (index + items.length) % items.length;
        this.setState({ activeIndex: next });
        items[next].focus();
    };

    private handleKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
        const items = this.collectItems();
        if (items.length === 0) return;
        const current = items.findIndex((el) => el === document.activeElement);
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.focusItem(current + 1);
                break;
            case "ArrowUp":
                event.preventDefault();
                this.focusItem(current - 1);
                break;
            case "Home":
                event.preventDefault();
                this.focusItem(0);
                break;
            case "End":
                event.preventDefault();
                this.focusItem(items.length - 1);
                break;
            case "Tab":
                if (this.props.onClose) this.props.onClose();
                break;
        }
    };

    render(): ReactNode {
        const enriched = Children.map(this.props.children, (child) => {
            if (!isValidElement(child)) return child;
            const element = child as ReactElement<{ onSelect?: () => void; closeMenu?: () => void }>;
            if (this.props.onClose && element.props && "onSelect" in element.props) {
                return cloneElement(element, { closeMenu: this.props.onClose });
            }
            return element;
        });

        return (
            <ul
                ref={this.listRef}
                className={styles["menu"]}
                role="menu"
                aria-label={this.props.label}
                onKeyDown={this.handleKeyDown}
                tabIndex={-1}
            >
                {enriched}
            </ul>
        );
    }
}
