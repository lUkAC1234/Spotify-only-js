import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { AppDialog } from "@/app/shared/ui/app-dialog/app-dialog";
import { Button } from "@/app/shared/ui/buttons/button";
import { Spinner } from "@/app/shared/ui/loaders/spinner";

import styles from "./confirm-dialog.module.scss";

interface Props {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busyLabel?: string;
    isBusy?: boolean;
    danger?: boolean;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
}

export class ConfirmDialog extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    private handleCancel = (): void => {
        if (this.props.isBusy) return;
        this.props.onCancel();
    };

    private handleConfirm = async (): Promise<void> => {
        if (this.props.isBusy) return;
        await this.props.onConfirm();
    };

    render(): ReactNode {
        const {
            isOpen,
            title,
            description,
            confirmLabel,
            cancelLabel,
            busyLabel,
            isBusy = false,
            danger = false,
        } = this.props;

        const cancel = cancelLabel ?? this.locale.t("common", "auth.logout-confirm-cancel");
        const confirm = confirmLabel ?? this.locale.t("common", "auth.logout-confirm-yes");

        return (
            <AppDialog
                isOpen={isOpen}
                onClose={this.handleCancel}
                size="sm"
                title={title}
                closeOnBackdrop={!isBusy}
                closeOnEscape={!isBusy}
                footer={
                    <>
                        <Button buttonType="secondary" onClick={this.handleCancel} disabled={isBusy}>
                            {cancel}
                        </Button>
                        <Button
                            onClick={() => void this.handleConfirm()}
                            disabled={isBusy}
                            aria-busy={isBusy}
                            className={danger ? styles["confirm-dialog__danger"] : undefined}
                        >
                            {isBusy && busyLabel ? (
                                <span className={styles["confirm-dialog__busy"]}>
                                    <Spinner size="sm" tone="current" inline />
                                    <span>{busyLabel}</span>
                                </span>
                            ) : (
                                confirm
                            )}
                        </Button>
                    </>
                }
            >
                {description && (
                    <p className={styles["confirm-dialog__text"]}>{description}</p>
                )}
            </AppDialog>
        );
    }
}
