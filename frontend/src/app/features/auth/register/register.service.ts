import { action, computed, makeObservable, observable } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject, injectable } from "@/app/shared/decorators/di";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

@injectable()
export class RegisterService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly navigate: NavigateService = inject(NavigateService);
    private readonly locale: LocaleService = inject(LocaleService);

    @observable email: string = "";
    @observable username: string = "";
    @observable displayName: string = "";
    @observable password: string = "";
    @observable showPassword: boolean = false;
    @observable submitError: string = "";
    @observable detailErrors: Record<string, string> = {};

    constructor() {
        makeObservable(this);
    }

    @computed
    get isSubmitting(): boolean {
        return this.auth.isLoading;
    }

    @computed
    get clientErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        const trimmedEmail = this.email.trim();
        const trimmedUsername = this.username.trim();
        if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
            errors.email = this.locale.t("common", "auth.error.email-invalid");
        }
        if (trimmedUsername) {
            if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
                errors.username = this.locale.t("common", "auth.error.username-length");
            } else if (!USERNAME_REGEX.test(trimmedUsername)) {
                errors.username = this.locale.t("common", "auth.error.username-chars");
            }
        }
        if (this.password && this.password.length < 8) {
            errors.password = this.locale.t("common", "auth.error.password-length");
        }
        return errors;
    }

    @computed
    get errors(): Record<string, string> {
        return { ...this.clientErrors, ...this.detailErrors };
    }

    @computed
    get canSubmit(): boolean {
        return (
            this.email.trim().length > 0 &&
            this.username.trim().length >= 3 &&
            this.password.length >= 8 &&
            Object.keys(this.clientErrors).length === 0 &&
            !this.isSubmitting
        );
    }

    @action.bound
    setEmail(value: string): void {
        this.email = value;
        this.submitError = "";
        delete this.detailErrors.email;
    }

    @action.bound
    setUsername(value: string): void {
        this.username = value;
        this.submitError = "";
        delete this.detailErrors.username;
    }

    @action.bound
    setDisplayName(value: string): void {
        this.displayName = value;
    }

    @action.bound
    setPassword(value: string): void {
        this.password = value;
        this.submitError = "";
        delete this.detailErrors.password;
    }

    @action.bound
    toggleShowPassword(): void {
        this.showPassword = !this.showPassword;
    }

    @action.bound
    private setSubmitError(message: string, details: Record<string, string> = {}): void {
        this.submitError = message;
        this.detailErrors = details;
    }

    submit = async (): Promise<void> => {
        if (!this.canSubmit) return;
        const result = await this.auth.register({
            email: this.email.trim().toLowerCase(),
            username: this.username.trim(),
            displayName: this.displayName.trim() || undefined,
            password: this.password,
        });
        if (result) {
            this.reset();
            this.navigate.navigate("/");
            return;
        }

        const error = this.auth.lastError;
        const fieldErrors: Record<string, string> = {};
        if (error?.details && typeof error.details === "object") {
            const details = error.details as Record<string, unknown>;
            for (const [key, value] of Object.entries(details)) {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
                    fieldErrors[key] = value[0];
                } else if (typeof value === "string") {
                    fieldErrors[key] = value;
                }
            }
        }
        this.setSubmitError(error?.message ?? this.locale.t("common", "auth.error.generic"), fieldErrors);
    };

    @action.bound
    reset(): void {
        this.email = "";
        this.username = "";
        this.displayName = "";
        this.password = "";
        this.showPassword = false;
        this.submitError = "";
        this.detailErrors = {};
    }
}
