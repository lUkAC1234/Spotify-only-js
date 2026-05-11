import { observer } from "mobx-react";
import { Component, ReactNode, RefObject, createRef } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { LogoutConfirmModal } from "@/app/shared/ui/logout-confirm-modal/logout-confirm-modal";
import { Menu } from "@/app/shared/ui/popover/menu";
import { MenuDivider } from "@/app/shared/ui/popover/menu-divider";
import { MenuItem } from "@/app/shared/ui/popover/menu-item";
import { Popover } from "@/app/shared/ui/popover/popover";

import styles from "./profile-menu.module.scss";

interface State {
    isOpen: boolean;
    confirmLogout: boolean;
}

@observer
export class ProfileMenu extends Component<object, State> {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private navigate: NavigateService = inject(NavigateService);

    state: State = { isOpen: false, confirmLogout: false };
    private triggerRef: RefObject<HTMLButtonElement | null> = createRef();

    private toggle = (): void => {
        this.setState((prev) => ({ isOpen: !prev.isOpen }));
    };

    private close = (): void => {
        this.setState({ isOpen: false });
    };

    private handleAccount = (): void => {
        const me = this.auth.me;
        if (!me) return;
        this.navigate.navigate(`/user/${me.id}`);
    };

    private handleSettings = (): void => {
        this.navigate.navigate("/settings");
    };

    private openSignOutConfirm = (): void => {
        this.setState({ isOpen: false, confirmLogout: true });
    };

    private closeSignOutConfirm = (): void => {
        this.setState({ confirmLogout: false });
    };

    private handleSignedOut = (): void => {
        this.setState({ confirmLogout: false });
        this.navigate.navigate("/");
    };

    render(): ReactNode {
        const me = this.auth.me;
        if (!me) return null;
        const isOpen = this.state.isOpen;

        return (
            <>
                <button
                    type="button"
                    ref={this.triggerRef}
                    className={className(styles["menu__trigger"], {
                        [styles["menu__trigger--open"]]: isOpen,
                    })}
                    onClick={this.toggle}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={this.locale.t("common", "profile.account")}
                >
                    <span className={styles["menu__avatar"]}>
                        <Avatar name={me.displayName || me.username} image={me.avatar} />
                    </span>
                    <span className={styles["menu__name"]}>{me.displayName || me.username}</span>
                    <svg
                        className={className(styles["menu__chevron"], {
                            [styles["menu__chevron--open"]]: isOpen,
                        })}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 6l4 4 4-4" />
                    </svg>
                </button>
                <Popover
                    isOpen={isOpen}
                    anchorRef={this.triggerRef}
                    placement="bottom-end"
                    onClose={this.close}
                    label={this.locale.t("common", "profile.account")}
                >
                    <Menu label={this.locale.t("common", "profile.account")} onClose={this.close}>
                        <MenuItem
                            label={this.locale.t("common", "profile.account")}
                            onSelect={this.handleAccount}
                        />
                        <MenuItem
                            label={this.locale.t("common", "profile.privacy")}
                            onSelect={this.handleSettings}
                        />
                        <MenuDivider />
                        <MenuItem
                            label={this.locale.t("common", "auth.sign-out")}
                            danger
                            onSelect={this.openSignOutConfirm}
                        />
                    </Menu>
                </Popover>
                <LogoutConfirmModal
                    isOpen={this.state.confirmLogout}
                    onCancel={this.closeSignOutConfirm}
                    onConfirmed={this.handleSignedOut}
                />
            </>
        );
    }
}
