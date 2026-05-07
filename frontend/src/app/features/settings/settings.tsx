import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode, RefObject, createRef } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";
import { Input } from "@/app/shared/ui/inputs/input";

import styles from "./settings.module.scss";
import { SettingsService } from "./settings.service";

@observer
export class Settings extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: SettingsService = inject(SettingsService);
    private fileInputRef: RefObject<HTMLInputElement | null> = createRef<HTMLInputElement>();

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

    private handleSignOut = (): void => {
        void this.service.signOut();
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

        const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();

        return (
            <section className={styles["settings"]}>
                <header className={styles["settings__header"]}>
                    <h1 className={styles["settings__title"]}>{this.locale.t("common", "settings.title")}</h1>
                    <p className={styles["settings__subtitle"]}>
                        {this.locale.t("common", "settings.subtitle")}
                    </p>
                </header>

                <form className={styles["settings__section"]} onSubmit={this.handleProfileSubmit}>
                    <h2 className={styles["settings__section-title"]}>
                        {this.locale.t("common", "settings.profile")}
                    </h2>

                    <div className={styles["settings__avatar-row"]}>
                        <div className={styles["settings__avatar"]}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" />
                            ) : (
                                <span className={styles["settings__avatar-initials"]}>{initials}</span>
                            )}
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

                    <div className={styles["settings__actions"]}>
                        <Button type="submit" disabled={!this.service.isProfileDirty || this.service.isLoading}>
                            {this.locale.t("common", "settings.save")}
                        </Button>
                    </div>
                </form>

                <form className={styles["settings__section"]} onSubmit={this.handlePasswordSubmit}>
                    <h2 className={styles["settings__section-title"]}>
                        {this.locale.t("common", "settings.password")}
                    </h2>

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

                    {this.service.passwordError && (
                        <p className={styles["settings__error"]}>{this.service.passwordError}</p>
                    )}
                    {this.service.passwordMessage && (
                        <p className={styles["settings__message"]}>{this.service.passwordMessage}</p>
                    )}

                    <div className={styles["settings__actions"]}>
                        <Button type="submit" disabled={!this.service.canChangePassword}>
                            {this.locale.t("common", "settings.update-password")}
                        </Button>
                    </div>
                </form>

                <section className={styles["settings__section"]}>
                    <h2 className={styles["settings__section-title"]}>
                        {this.locale.t("common", "settings.privacy")}
                    </h2>

                    <label className={styles["settings__toggle"]}>
                        <input
                            type="checkbox"
                            checked={user.isProfilePublic}
                            onChange={() => void this.service.togglePrivacy("isProfilePublic")}
                        />
                        <span className={styles["settings__toggle-meta"]}>
                            <span className={styles["settings__toggle-title"]}>
                                {this.locale.t("common", "settings.privacy-profile")}
                            </span>
                            <span className={styles["settings__toggle-hint"]}>
                                {this.locale.t("common", "settings.privacy-profile-hint")}
                            </span>
                        </span>
                    </label>

                    <label className={styles["settings__toggle"]}>
                        <input
                            type="checkbox"
                            checked={user.isListeningPublic}
                            onChange={() => void this.service.togglePrivacy("isListeningPublic")}
                        />
                        <span className={styles["settings__toggle-meta"]}>
                            <span className={styles["settings__toggle-title"]}>
                                {this.locale.t("common", "settings.privacy-listening")}
                            </span>
                            <span className={styles["settings__toggle-hint"]}>
                                {this.locale.t("common", "settings.privacy-listening-hint")}
                            </span>
                        </span>
                    </label>

                    <label className={styles["settings__toggle"]}>
                        <input
                            type="checkbox"
                            checked={user.isRecentHistoryPublic}
                            onChange={() => void this.service.togglePrivacy("isRecentHistoryPublic")}
                        />
                        <span className={styles["settings__toggle-meta"]}>
                            <span className={styles["settings__toggle-title"]}>
                                {this.locale.t("common", "settings.privacy-history")}
                            </span>
                            <span className={styles["settings__toggle-hint"]}>
                                {this.locale.t("common", "settings.privacy-history-hint")}
                            </span>
                        </span>
                    </label>
                </section>

                <section className={styles["settings__section"]}>
                    <h2 className={styles["settings__section-title"]}>
                        {this.locale.t("common", "settings.session")}
                    </h2>
                    <div className={styles["settings__actions"]}>
                        <Button type="button" buttonType="secondary" onClick={this.handleSignOut} removeBgEffect>
                            {this.locale.t("common", "auth.sign-out")}
                        </Button>
                    </div>
                </section>
            </section>
        );
    }
}
