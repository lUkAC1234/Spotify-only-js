import { observer } from "mobx-react";
import { Component, MouseEvent, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./side-panel.module.scss";

interface Props {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    ariaLabel?: string;
    closeAriaLabel?: string;
    showBackdrop?: boolean;
}

@observer
export class SidePanel extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    componentDidMount(): void {
        document.addEventListener("keydown", this.handleKeydown);
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleKeydown);
    }

    private handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.props.isOpen) {
            event.stopPropagation();
            this.props.onClose();
        }
    };

    private handleBackdropClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        this.props.onClose();
    };

    render(): ReactNode {
        const { isOpen, title, onClose, children, ariaLabel, closeAriaLabel, showBackdrop } = this.props;
        const closeLabel = closeAriaLabel ?? this.locale.t("common", "playlist.close");

        return (
            <>
                {showBackdrop && (
                    <button
                        type="button"
                        className={className(styles["panel-backdrop"], {
                            [styles["panel-backdrop--visible"]]: isOpen,
                        })}
                        onClick={this.handleBackdropClick}
                        aria-hidden={!isOpen}
                        tabIndex={-1}
                    />
                )}
                <aside
                    className={className(styles["panel"], {
                        [styles["panel--open"]]: isOpen,
                    })}
                    role="dialog"
                    aria-hidden={!isOpen}
                    aria-label={ariaLabel ?? title}
                >
                    <header className={styles["panel__header"]}>
                        <h2 className={styles["panel__title"]}>{title}</h2>
                        <button
                            type="button"
                            className={styles["panel__close"]}
                            onClick={onClose}
                            aria-label={closeLabel}
                        >
                            <SVG_CloseIcon />
                        </button>
                    </header>
                    <div className={styles["panel__body"]}>{children}</div>
                </aside>
            </>
        );
    }
}
