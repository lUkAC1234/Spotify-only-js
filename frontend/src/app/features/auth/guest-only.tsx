import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";
import { AppDialog } from "@/app/shared/ui/app-dialog/app-dialog";
import { Button } from "@/app/shared/ui/buttons/button";
import { Spinner } from "@/app/shared/ui/loaders/spinner";

import styles from "./guest-only.module.scss";

interface Props {
    children: ReactNode;
}

interface State {
    isLoggingOut: boolean;
}

@observer
export class GuestOnly extends Component<Props, State> {
    private auth: AuthService = inject(AuthService);
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);

    state: State = { isLoggingOut: false };

    private handleConfirm = async (): Promise<void> => {
        if (this.state.isLoggingOut) return;
        this.setState({ isLoggingOut: true });
        try {
            await this.auth.logout();
        } finally {
            this.setState({ isLoggingOut: false });
        }
    };

    private handleCancel = (): void => {
        if (this.state.isLoggingOut) return;
        this.navigate.navigate("/");
    };

    render(): ReactNode {
        if (!this.auth.isAuthenticated) {
            return this.props.children;
        }

        const me = this.auth.me;
        const accountLabel = me?.displayName || me?.username || me?.email || "";
        const { isLoggingOut } = this.state;

        return (
            <AppDialog
                isOpen
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
                                <span className={styles["guest-only__busy"]}>
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
                <div className={styles["guest-only__body"]}>
                    <p className={styles["guest-only__text"]}>
                        {this.locale.t("common", "auth.logout-confirm-body")}
                    </p>
                    {accountLabel && (
                        <p className={styles["guest-only__account"]}>{accountLabel}</p>
                    )}
                </div>
            </AppDialog>
        );
    }
}
