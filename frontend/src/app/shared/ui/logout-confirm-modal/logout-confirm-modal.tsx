import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { AppDialog } from "@/app/shared/ui/app-dialog/app-dialog";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { Button } from "@/app/shared/ui/buttons/button";
import { Spinner } from "@/app/shared/ui/loaders/spinner";

import styles from "./logout-confirm-modal.module.scss";

interface Props {
    isOpen: boolean;
    onCancel: () => void;
    onConfirmed?: () => void;
}

interface State {
    isLoggingOut: boolean;
}

@observer
export class LogoutConfirmModal extends Component<Props, State> {
    private auth: AuthService = inject(AuthService);
    private locale: LocaleService = inject(LocaleService);

    state: State = { isLoggingOut: false };

    private handleConfirm = async (): Promise<void> => {
        if (this.state.isLoggingOut) return;
        this.setState({ isLoggingOut: true });
        try {
            await this.auth.logout();
            this.props.onConfirmed?.();
        } finally {
            this.setState({ isLoggingOut: false });
        }
    };

    private handleCancel = (): void => {
        if (this.state.isLoggingOut) return;
        this.props.onCancel();
    };

    render(): ReactNode {
        const { isOpen } = this.props;
        const { isLoggingOut } = this.state;
        const me = this.auth.me;
        const accountLabel = me?.displayName || me?.username || me?.email || "";

        return (
            <AppDialog
                isOpen={isOpen}
                onClose={this.handleCancel}
                size="sm"
                title={this.locale.t("common", "auth.logout-confirm-title")}
                closeOnBackdrop={!isLoggingOut}
                closeOnEscape={!isLoggingOut}
                footer={
                    <>
                        <Button
                            buttonType="secondary"
                            onClick={this.handleCancel}
                            disabled={isLoggingOut}
                        >
                            {this.locale.t("common", "auth.logout-confirm-cancel")}
                        </Button>
                        <Button onClick={this.handleConfirm} disabled={isLoggingOut} aria-busy={isLoggingOut}>
                            {isLoggingOut ? (
                                <span className={styles["logout-confirm__busy"]}>
                                    <Spinner size="sm" tone="current" inline />
                                    <span>{this.locale.t("common", "auth.signing-out")}</span>
                                </span>
                            ) : (
                                this.locale.t("common", "auth.logout-confirm-yes")
                            )}
                        </Button>
                    </>
                }
            >
                <div className={styles["logout-confirm__body"]}>
                    {me && (
                        <div className={styles["logout-confirm__user"]}>
                            <span className={styles["logout-confirm__avatar"]}>
                                <Avatar name={accountLabel} image={me.avatar} />
                            </span>
                            <span className={styles["logout-confirm__user-text"]}>
                                <span className={styles["logout-confirm__user-label"]}>
                                    {this.locale.t("common", "profile.account")}
                                </span>
                                <span className={styles["logout-confirm__user-name"]}>{accountLabel}</span>
                            </span>
                        </div>
                    )}
                    <p className={styles["logout-confirm__text"]}>
                        {this.locale.t("common", "auth.logout-confirm-prompt")}
                    </p>
                </div>
            </AppDialog>
        );
    }
}
