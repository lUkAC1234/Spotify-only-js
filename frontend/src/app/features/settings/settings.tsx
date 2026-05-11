import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode, RefObject, createRef } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { Button } from "@/app/shared/ui/buttons/button";
import { Input } from "@/app/shared/ui/inputs/input";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { LogoutConfirmModal } from "@/app/shared/ui/logout-confirm-modal/logout-confirm-modal";

import styles from "./settings.module.scss";
import { SettingsService } from "./settings.service";

interface State {
    confirmLogout: boolean;
}

@observer
export class Settings extends Component<object, State> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: SettingsService = inject(SettingsService);
    private fileInputRef: RefObject<HTMLInputElement | null> = createRef<HTMLInputElement>();

    state: State = { confirmLogout: false };

    componentDidMount(): void {
        this.title.construct({ title: "Settings", titleNamespace: "common", titleTKey: "nav.settings" });
        this.title.init();
        this.service.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
        this.service.dispose();
    }

    private handleDisplayName = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setDisplayName(event.target.value);
    };

    private handleCurrentPassword = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setCurrentPassword(event.target.value);
    };

    private handleNewPassword = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setNewPassword(event.target.value);
    };

    private handleProfileSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        void this.service.saveProfile();
    };

    private handlePasswordSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        void this.service.changePassword();
    };

    private handleAvatarPick = (): void => {
        this.fileInputRef.current?.click();
    };

    private handleAvatarChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;
        void this.service.uploadAvatar(file);
        event.target.value = "";
    };

    private handleAvatarDelete = (): void => {
        void this.service.deleteAvatar();
    };

    private openSignOutConfirm = (): void => {
        this.setState({ confirmLogout: true });
    };

    private closeSignOutConfirm = (): void => {
        this.setState({ confirmLogout: false });
    };

    private handleSignedOut = (): void => {
        this.setState({ confirmLogout: false });
        void this.service.afterSignOut();
    };

    render(): ReactNode {
        const { user } = this.service;
        if (!user) {
            return (
                <section className={styles["settings__placeholder"]}>
                    <p>{this.locale.t("common", "settings.signed-out")}</p>
                </section>
            );
        }

        const accountName = user.displayName || user.username;

        return (
            <section className={styles["settings"]}>
                <header className={styles["settings__hero"]}>
                    <div className={styles["settings__hero-avatar"]}>
                        <Avatar name={accountName} image={user.avatar} />
                    </div>
                    <div className={styles["settings__hero-text"]}>
                        <span className={styles["settings__overline"]}>
                            {this.locale.t("common", "settings.title")}
                        </span>
                        <h1 className={styles["settings__title"]}>{accountName}</h1>
                        <p className={styles["settings__subtitle"]}>{user.email}</p>
                    </div>
                </header>

                <div className={styles["settings__sections"]}>
                    <form className={styles["settings__card"]} onSubmit={this.handleProfileSubmit}>
                        <header className={styles["settings__card-header"]}>
                            <h2 className={styles["settings__card-title"]}>
                                {this.locale.t("common", "settings.profile")}
                            </h2>
                            <p className={styles["settings__card-hint"]}>
                                {this.locale.t("common", "settings.subtitle")}
                            </p>
                        </header>

                        <div className={styles["settings__avatar-row"]}>
                            <div className={styles["settings__avatar"]}>
                                <Avatar name={accountName} image={user.avatar} />
                            </div>
                            <div className={styles["settings__avatar-actions"]}>
                                <input
                                    ref={this.fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className={styles["settings__file"]}
                                    onChange={this.handleAvatarChange}
                                />
                                <Button
                                    type="button"
                                    buttonType="secondary"
                                    small
                                    onClick={this.handleAvatarPick}
                                    removeBgEffect
                                >
                                    {this.locale.t("common", "settings.upload-avatar")}
                                </Button>
                                {user.avatar && (
                                    <Button
                                        type="button"
                                        buttonType="transparent"
                                        small
                                        onClick={this.handleAvatarDelete}
                                        removeBgEffect
                                    >
                                        {this.locale.t("common", "settings.remove-avatar")}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {this.service.avatarError && (
                            <p className={styles["settings__error"]}>{this.service.avatarError}</p>
                        )}
                        {this.service.avatarMessage && (
                            <p className={styles["settings__message"]}>{this.service.avatarMessage}</p>
                        )}

                        <div className={styles["settings__grid"]}>
                            <div className={styles["settings__field"]}>
                                <label className={styles["settings__label"]} htmlFor="settings-email">
                                    {this.locale.t("common", "auth.email-label")}
                                </label>
                                <Input
                                    id="settings-email"
                                    value={user.email}
                                    readOnly
                                    fullwidth
                                    tabIndex={-1}
                                />
                            </div>

                            <div className={styles["settings__field"]}>
                                <label className={styles["settings__label"]} htmlFor="settings-username">
                                    {this.locale.t("common", "auth.username-label")}
                                </label>
                                <Input
                                    id="settings-username"
                                    value={user.username}
                                    readOnly
                                    fullwidth
                                    tabIndex={-1}
                                />
                            </div>
                        </div>

                        <div className={styles["settings__field"]}>
                            <label className={styles["settings__label"]} htmlFor="settings-display-name">
                                {this.locale.t("common", "auth.display-name-label")}
                            </label>
                            <Input
                                id="settings-display-name"
                                type="text"
                                fullwidth
                                value={this.service.displayName}
                                onChange={this.handleDisplayName}
                                placeholder={this.locale.t("common", "auth.display-name-placeholder")}
                            />
                        </div>

                        {this.service.profileError && (
                            <p className={styles["settings__error"]}>{this.service.profileError}</p>
                        )}
                        {this.service.profileMessage && (
                            <p className={styles["settings__message"]}>{this.service.profileMessage}</p>
                        )}

                        <footer className={styles["settings__card-footer"]}>
                            <Button
                                type="submit"
                                disabled={!this.service.isProfileDirty || this.service.isLoading}
                                aria-busy={this.service.isLoading}
                            >
                                {this.service.isLoading ? (
                                    <span className={styles["settings__submit-busy"]}>
                                        <Spinner size="sm" tone="current" inline />
                                        <span>{this.locale.t("common", "settings.saving")}</span>
                                    </span>
                                ) : (
                                    this.locale.t("common", "settings.save")
                                )}
                            </Button>
                        </footer>
                    </form>

                    <form className={styles["settings__card"]} onSubmit={this.handlePasswordSubmit}>
                        <header className={styles["settings__card-header"]}>
                            <h2 className={styles["settings__card-title"]}>
                                {this.locale.t("common", "settings.password")}
                            </h2>
                            <p className={styles["settings__card-hint"]}>
                                {this.locale.t("common", "settings.password-hint")}
                            </p>
                        </header>

                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={user.username}
                            readOnly
                            hidden
                            tabIndex={-1}
                            aria-hidden="true"
                        />

                        <div className={styles["settings__grid"]}>
                            <div className={styles["settings__field"]}>
                                <label className={styles["settings__label"]} htmlFor="settings-current-password">
                                    {this.locale.t("common", "settings.current-password")}
                                </label>
                                <Input
                                    id="settings-current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    fullwidth
                                    value={this.service.currentPassword}
                                    onChange={this.handleCurrentPassword}
                                />
                            </div>

                            <div className={styles["settings__field"]}>
                                <label className={styles["settings__label"]} htmlFor="settings-new-password">
                                    {this.locale.t("common", "settings.new-password")}
                                </label>
                                <Input
                                    id="settings-new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    fullwidth
                                    value={this.service.newPassword}
                                    onChange={this.handleNewPassword}
                                />
                            </div>
                        </div>

                        {this.service.passwordError && (
                            <p className={styles["settings__error"]}>{this.service.passwordError}</p>
                        )}
                        {this.service.passwordMessage && (
                            <p className={styles["settings__message"]}>{this.service.passwordMessage}</p>
                        )}

                        <footer className={styles["settings__card-footer"]}>
                            <Button
                                type="submit"
                                disabled={!this.service.canChangePassword}
                                aria-busy={this.service.isLoading}
                            >
                                {this.service.isLoading ? (
                                    <span className={styles["settings__submit-busy"]}>
                                        <Spinner size="sm" tone="current" inline />
                                        <span>{this.locale.t("common", "settings.saving")}</span>
                                    </span>
                                ) : (
                                    this.locale.t("common", "settings.update-password")
                                )}
                            </Button>
                        </footer>
                    </form>

                    <section className={styles["settings__card"]}>
                        <header className={styles["settings__card-header"]}>
                            <h2 className={styles["settings__card-title"]}>
                                {this.locale.t("common", "settings.privacy")}
                            </h2>
                            <p className={styles["settings__card-hint"]}>
                                {this.locale.t("common", "settings.privacy-hint")}
                            </p>
                        </header>

                        <ul className={styles["settings__toggles"]}>
                            <li>
                                <label className={styles["settings__toggle"]}>
                                    <span className={styles["settings__toggle-meta"]}>
                                        <span className={styles["settings__toggle-title"]}>
                                            {this.locale.t("common", "settings.privacy-profile")}
                                        </span>
                                        <span className={styles["settings__toggle-hint"]}>
                                            {this.locale.t("common", "settings.privacy-profile-hint")}
                                        </span>
                                    </span>
                                    <span className={styles["settings__switch"]}>
                                        <input
                                            type="checkbox"
                                            checked={user.isProfilePublic}
                                            onChange={() => void this.service.togglePrivacy("isProfilePublic")}
                                        />
                                        <span className={styles["settings__switch-track"]} aria-hidden="true">
                                            <span className={styles["settings__switch-thumb"]} />
                                        </span>
                                    </span>
                                </label>
                            </li>
                            <li>
                                <label className={styles["settings__toggle"]}>
                                    <span className={styles["settings__toggle-meta"]}>
                                        <span className={styles["settings__toggle-title"]}>
                                            {this.locale.t("common", "settings.privacy-listening")}
                                        </span>
                                        <span className={styles["settings__toggle-hint"]}>
                                            {this.locale.t("common", "settings.privacy-listening-hint")}
                                        </span>
                                    </span>
                                    <span className={styles["settings__switch"]}>
                                        <input
                                            type="checkbox"
                                            checked={user.isListeningPublic}
                                            onChange={() => void this.service.togglePrivacy("isListeningPublic")}
                                        />
                                        <span className={styles["settings__switch-track"]} aria-hidden="true">
                                            <span className={styles["settings__switch-thumb"]} />
                                        </span>
                                    </span>
                                </label>
                            </li>
                            <li>
                                <label className={styles["settings__toggle"]}>
                                    <span className={styles["settings__toggle-meta"]}>
                                        <span className={styles["settings__toggle-title"]}>
                                            {this.locale.t("common", "settings.privacy-history")}
                                        </span>
                                        <span className={styles["settings__toggle-hint"]}>
                                            {this.locale.t("common", "settings.privacy-history-hint")}
                                        </span>
                                    </span>
                                    <span className={styles["settings__switch"]}>
                                        <input
                                            type="checkbox"
                                            checked={user.isRecentHistoryPublic}
                                            onChange={() => void this.service.togglePrivacy("isRecentHistoryPublic")}
                                        />
                                        <span className={styles["settings__switch-track"]} aria-hidden="true">
                                            <span className={styles["settings__switch-thumb"]} />
                                        </span>
                                    </span>
                                </label>
                            </li>
                        </ul>
                    </section>

                    <section className={styles["settings__card"]}>
                        <header className={styles["settings__card-header"]}>
                            <h2 className={styles["settings__card-title"]}>
                                {this.locale.t("common", "settings.session")}
                            </h2>
                            <p className={styles["settings__card-hint"]}>
                                {this.locale.t("common", "settings.session-hint")}
                            </p>
                        </header>
                        <footer className={styles["settings__card-footer"]}>
                            <Button
                                type="button"
                                buttonType="secondary"
                                onClick={this.openSignOutConfirm}
                                removeBgEffect
                            >
                                {this.locale.t("common", "auth.sign-out")}
                            </Button>
                        </footer>
                    </section>
                </div>

                <LogoutConfirmModal
                    isOpen={this.state.confirmLogout}
                    onCancel={this.closeSignOutConfirm}
                    onConfirmed={this.handleSignedOut}
                />
            </section>
        );
    }
}
