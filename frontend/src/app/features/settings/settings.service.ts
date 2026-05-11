import { action, computed, makeObservable, observable, reaction } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { SocialService } from "@/app/core/services/social/social.service";
import { PrivacyPatch } from "@/app/core/types/user";
import { inject, injectable } from "@/app/shared/decorators/di";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

@injectable()
export class SettingsService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly navigate: NavigateService = inject(NavigateService);
    private readonly locale: LocaleService = inject(LocaleService);
    private readonly social: SocialService = inject(SocialService);
    private readonly disposable: DisposableService = inject(DisposableService);

    @observable displayName: string = "";
    @observable profileMessage: string = "";
    @observable profileError: string = "";
    @observable avatarMessage: string = "";
    @observable avatarError: string = "";
    @observable currentPassword: string = "";
    @observable newPassword: string = "";
    @observable passwordMessage: string = "";
    @observable passwordError: string = "";

    constructor() {
        makeObservable(this);
    }

    @computed
    get user() {
        return this.auth.me;
    }

    @computed
    get isLoading(): boolean {
        return this.auth.isLoading;
    }

    @computed
    get isProfileDirty(): boolean {
        return !!this.user && this.displayName.trim() !== (this.user.displayName ?? "");
    }

    @computed
    get canChangePassword(): boolean {
        return this.currentPassword.length > 0 && this.newPassword.length >= 8 && !this.isLoading;
    }

    init(): void {
        this.disposable.register(
            "settings-display-name-sync",
            reaction(
                () => this.user?.displayName ?? "",
                (value) => {
                    this.displayName = value;
                },
                { fireImmediately: true },
            ),
        );

        this.disposable.register(
            "settings-redirect-on-logout",
            reaction(
                () => this.auth.isAuthenticated,
                (authenticated) => {
                    if (this.auth.isBootstrapped && !authenticated) {
                        this.navigate.navigate("/login");
                    }
                },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
        this.resetAll();
    }

    @action.bound
    setDisplayName(value: string): void {
        this.displayName = value;
        this.profileMessage = "";
        this.profileError = "";
    }

    @action.bound
    setCurrentPassword(value: string): void {
        this.currentPassword = value;
        this.passwordMessage = "";
        this.passwordError = "";
    }

    @action.bound
    setNewPassword(value: string): void {
        this.newPassword = value;
        this.passwordMessage = "";
        this.passwordError = "";
    }

    @action.bound
    private setProfileMessage(message: string): void {
        this.profileMessage = message;
    }

    @action.bound
    private setProfileError(message: string): void {
        this.profileError = message;
    }

    @action.bound
    private setAvatarMessage(message: string): void {
        this.avatarMessage = message;
    }

    @action.bound
    private setAvatarError(message: string): void {
        this.avatarError = message;
    }

    @action.bound
    private setPasswordMessage(message: string): void {
        this.passwordMessage = message;
    }

    @action.bound
    private setPasswordError(message: string): void {
        this.passwordError = message;
    }

    @action.bound
    private resetAll(): void {
        this.profileMessage = "";
        this.profileError = "";
        this.avatarMessage = "";
        this.avatarError = "";
        this.currentPassword = "";
        this.newPassword = "";
        this.passwordMessage = "";
        this.passwordError = "";
    }

    saveProfile = async (): Promise<void> => {
        if (!this.isProfileDirty) return;
        const trimmed = this.displayName.trim();
        if (!trimmed) {
            this.setProfileError(this.locale.t("common", "settings.error.display-name-required"));
            return;
        }
        const updated = await this.auth.updateProfile({ displayName: trimmed });
        if (updated) {
            this.setProfileMessage(this.locale.t("common", "settings.profile-saved"));
            this.setProfileError("");
            return;
        }
        this.setProfileError(this.auth.lastError?.message ?? this.locale.t("common", "auth.error.generic"));
    };

    uploadAvatar = async (file: File | null): Promise<void> => {
        if (!file) return;
        if (file.size > MAX_AVATAR_BYTES) {
            this.setAvatarError(this.locale.t("common", "settings.error.avatar-too-large"));
            return;
        }
        if (!file.type.startsWith("image/")) {
            this.setAvatarError(this.locale.t("common", "settings.error.avatar-invalid"));
            return;
        }
        const updated = await this.auth.uploadAvatar(file);
        if (updated) {
            this.setAvatarMessage(this.locale.t("common", "settings.avatar-saved"));
            this.setAvatarError("");
            return;
        }
        this.setAvatarError(this.auth.lastError?.message ?? this.locale.t("common", "auth.error.generic"));
    };

    deleteAvatar = async (): Promise<void> => {
        const updated = await this.auth.deleteAvatar();
        if (updated) {
            this.setAvatarMessage(this.locale.t("common", "settings.avatar-removed"));
            this.setAvatarError("");
            return;
        }
        this.setAvatarError(this.auth.lastError?.message ?? this.locale.t("common", "auth.error.generic"));
    };

    changePassword = async (): Promise<void> => {
        if (!this.canChangePassword) return;
        const ok = await this.auth.changePassword({
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
        });
        if (ok) {
            this.setPasswordMessage(this.locale.t("common", "settings.password-saved"));
            this.setPasswordError("");
            this.currentPassword = "";
            this.newPassword = "";
            return;
        }
        this.setPasswordError(this.auth.lastError?.message ?? this.locale.t("common", "auth.error.generic"));
    };

    signOut = async (): Promise<void> => {
        await this.auth.logout();
        this.navigate.navigate("/login");
    };

    afterSignOut = (): void => {
        this.navigate.navigate("/login");
    };

    togglePrivacy = async (key: keyof PrivacyPatch): Promise<void> => {
        const me = this.auth.me;
        if (!me) return;
        const current = me[key as keyof typeof me] as boolean;
        const next = !current;
        const result = await this.social.patchPrivacy({ [key]: next } as PrivacyPatch);
        if (result) {
            this.auth.applyMePatch(result as Partial<typeof me>);
        }
    };
}
