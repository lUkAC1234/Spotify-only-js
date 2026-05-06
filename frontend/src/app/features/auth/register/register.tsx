import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";
import { Input } from "@/app/shared/ui/inputs/input";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./register.module.scss";
import { RegisterService } from "./register.service";

@observer
export class Register extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: RegisterService = inject(RegisterService);

    componentDidMount(): void {
        this.title.construct({ title: "Sign up", titleNamespace: "common", titleTKey: "auth.sign-up" });
        this.title.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
        this.service.reset();
    }

    private handleEmail = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setEmail(event.target.value);
    };

    private handleUsername = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setUsername(event.target.value);
    };

    private handleDisplayName = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setDisplayName(event.target.value);
    };

    private handlePassword = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setPassword(event.target.value);
    };

    private handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        void this.service.submit();
    };

    render(): ReactNode {
        const { email, username, displayName, password, showPassword, submitError, errors, isSubmitting, canSubmit } =
            this.service;

        return (
            <form className={styles["register"]} onSubmit={this.handleSubmit} noValidate>
                <header className={styles["register__header"]}>
                    <h1 className={styles["register__title"]}>{this.locale.t("common", "auth.sign-up")}</h1>
                    <p className={styles["register__subtitle"]}>{this.locale.t("common", "auth.create-prompt")}</p>
                </header>

                <div className={styles["register__field"]}>
                    <label className={styles["register__label"]} htmlFor="register-email">
                        {this.locale.t("common", "auth.email-label")}
                    </label>
                    <Input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        fullwidth
                        value={email}
                        onChange={this.handleEmail}
                        placeholder="you@example.com"
                        autoFocus
                    />
                    {errors.email && <span className={styles["register__error"]}>{errors.email}</span>}
                </div>

                <div className={styles["register__field"]}>
                    <label className={styles["register__label"]} htmlFor="register-username">
                        {this.locale.t("common", "auth.username-label")}
                    </label>
                    <Input
                        id="register-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        fullwidth
                        value={username}
                        onChange={this.handleUsername}
                        placeholder={this.locale.t("common", "auth.username-placeholder")}
                    />
                    {errors.username && <span className={styles["register__error"]}>{errors.username}</span>}
                </div>

                <div className={styles["register__field"]}>
                    <label className={styles["register__label"]} htmlFor="register-display-name">
                        {this.locale.t("common", "auth.display-name-label")}{" "}
                        <span className={styles["register__optional"]}>
                            {this.locale.t("common", "auth.optional")}
                        </span>
                    </label>
                    <Input
                        id="register-display-name"
                        name="displayName"
                        type="text"
                        autoComplete="nickname"
                        fullwidth
                        value={displayName}
                        onChange={this.handleDisplayName}
                        placeholder={this.locale.t("common", "auth.display-name-placeholder")}
                    />
                </div>

                <div className={styles["register__field"]}>
                    <label className={styles["register__label"]} htmlFor="register-password">
                        {this.locale.t("common", "auth.password-label")}
                    </label>
                    <Input
                        id="register-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        fullwidth
                        value={password}
                        onChange={this.handlePassword}
                        placeholder={this.locale.t("common", "auth.password-new-placeholder")}
                    />
                    {errors.password && <span className={styles["register__error"]}>{errors.password}</span>}
                </div>

                {submitError && (
                    <p className={styles["register__submit-error"]} role="alert">
                        {submitError}
                    </p>
                )}

                <Button type="submit" fullwidth disabled={!canSubmit} aria-busy={isSubmitting}>
                    {isSubmitting
                        ? this.locale.t("common", "auth.signing-up")
                        : this.locale.t("common", "auth.sign-up")}
                </Button>

                <p className={styles["register__switch"]}>
                    {this.locale.t("common", "auth.have-account")}{" "}
                    <NavLink to="/login" baseClass={styles["register__link"]}>
                        {this.locale.t("common", "auth.sign-in")}
                    </NavLink>
                </p>
            </form>
        );
    }
}
