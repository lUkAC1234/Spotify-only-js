import { action, computed, makeObservable, observable } from "mobx";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class LoginService {
    private readonly auth: AuthService = inject(AuthService);
    private readonly navigate: NavigateService = inject(NavigateService);
    private readonly locale: LocaleService = inject(LocaleService);

    @observable identifier: string = "";
    @observable password: string = "";
    @observable showPassword: boolean = false;
    @observable submitError: string = "";

    constructor() {
        makeObservable(this);
    }

    @computed
    get isSubmitting(): boolean {
        return this.auth.isLoading;
    }

    @computed
    get canSubmit(): boolean {
        return this.identifier.trim().length > 0 && this.password.length >= 1 && !this.isSubmitting;
    }

    @action.bound
    setIdentifier(value: string): void {
        this.identifier = value;
        this.submitError = "";
    }

    @action.bound
    setPassword(value: string): void {
        this.password = value;
        this.submitError = "";
    }

    @action.bound
    toggleShowPassword(): void {
        this.showPassword = !this.showPassword;
    }

    @action.bound
    private setSubmitError(message: string): void {
        this.submitError = message;
    }

    submit = async (): Promise<void> => {
        if (!this.canSubmit) return;
        const result = await this.auth.login({
            identifier: this.identifier.trim(),
            password: this.password,
        });
        if (result) {
            this.reset();
            this.navigate.navigate("/");
            return;
        }
        const message = this.auth.lastError?.message ?? this.locale.t("common", "auth.error.invalid-credentials");
        this.setSubmitError(message);
    };

    @action.bound
    reset(): void {
        this.identifier = "";
        this.password = "";
        this.submitError = "";
        this.showPassword = false;
    }
}
