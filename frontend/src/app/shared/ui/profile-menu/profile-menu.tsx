import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./profile-menu.module.scss";

interface State {
    isOpen: boolean;
}

@observer
export class ProfileMenu extends Component<object, State> {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private navigate: NavigateService = inject(NavigateService);

    state: State = { isOpen: false };
    private rootRef: HTMLDivElement | null = null;

    componentDidMount(): void {
        document.addEventListener("mousedown", this.handleOutside);
        document.addEventListener("keydown", this.handleEscape);
    }

    componentWillUnmount(): void {
        document.removeEventListener("mousedown", this.handleOutside);
        document.removeEventListener("keydown", this.handleEscape);
    }

    private setRoot = (node: HTMLDivElement | null): void => {
        this.rootRef = node;
    };

    private handleOutside = (event: MouseEvent): void => {
        if (!this.state.isOpen) return;
        if (this.rootRef && this.rootRef.contains(event.target as Node)) return;
        this.setState({ isOpen: false });
    };

    private handleEscape = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.state.isOpen) {
            this.setState({ isOpen: false });
        }
    };

    private toggle = (): void => {
        this.setState((prev) => ({ isOpen: !prev.isOpen }));
    };

    private close = (): void => {
        this.setState({ isOpen: false });
    };

    private handleSignOut = async (): Promise<void> => {
        this.close();
        await this.auth.logout();
        this.navigate.navigate("/");
    };

    render(): ReactNode {
        const me = this.auth.me;
        if (!me) return null;
        const initial = (me.displayName || me.username).slice(0, 1).toUpperCase();
        const isOpen = this.state.isOpen;

        return (
            <div className={styles["menu"]} ref={this.setRoot}>
                <button
                    type="button"
                    className={className(styles["menu__trigger"], {
                        [styles["menu__trigger--open"]]: isOpen,
                    })}
                    onClick={this.toggle}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={this.locale.t("common", "profile.account")}
                >
                    <span className={styles["menu__avatar"]}>
                        {me.avatar ? <img src={me.avatar} alt="" loading="lazy" /> : <span>{initial}</span>}
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
                <div
                    className={className(styles["menu__panel"], {
                        [styles["menu__panel--open"]]: isOpen,
                    })}
                    role="menu"
                    aria-hidden={!isOpen}
                >
                    <ul className={styles["menu__list"]}>
                        <li>
                            <NavLink
                                to={`/user/${me.id}`}
                                baseClass={styles["menu__item"]}
                                onClick={this.close}
                            >
                                {this.locale.t("common", "profile.account")}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/settings" baseClass={styles["menu__item"]} onClick={this.close}>
                                {this.locale.t("common", "profile.privacy")}
                            </NavLink>
                        </li>
                        <li className={styles["menu__divider"]} role="presentation" />
                        <li>
                            <button
                                type="button"
                                className={className(styles["menu__item"], {
                                    [styles["menu__item--danger"]]: true,
                                })}
                                onClick={this.handleSignOut}
                            >
                                {this.locale.t("common", "auth.sign-out")}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
