import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";
import { Input } from "@/app/shared/ui/inputs/input";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./login.module.scss";
import { LoginService } from "./login.service";

@observer
export class Login extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: LoginService = inject(LoginService);

    componentDidMount(): void {
        this.title.construct({ title: "Sign in", titleNamespace: "common", titleTKey: "auth.sign-in" });
        this.title.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
        this.service.reset();
    }

    private handleIdentifier = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setIdentifier(event.target.value);
    };

    private handlePassword = (event: ChangeEvent<HTMLInputElement>): void => {
        this.service.setPassword(event.target.value);
    };

    private handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        void this.service.submit();
    };

    render(): ReactNode {
        const { identifier, password, showPassword, submitError, isSubmitting, canSubmit } = this.service;

        return (
            <form className={styles["login"]} onSubmit={this.handleSubmit} noValidate>
                <header className={styles["login__header"]}>
                    <h1 className={styles["login__title"]}>{this.locale.t("common", "auth.sign-in")}</h1>
                    <p className={styles["login__subtitle"]}>{this.locale.t("common", "auth.welcome-back")}</p>
                </header>

                <div className={styles["login__field"]}>
                    <label className={styles["login__label"]} htmlFor="login-identifier">
                        {this.locale.t("common", "auth.identifier-label")}
                    </label>
                    <Input
                        id="login-identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        fullwidth
                        value={identifier}
                        onChange={this.handleIdentifier}
                        placeholder={this.locale.t("common", "auth.identifier-placeholder")}
                        autoFocus
                    />
                </div>

                <div className={styles["login__field"]}>
                    <label className={styles["login__label"]} htmlFor="login-password">
                        {this.locale.t("common", "auth.password-label")}
                    </label>
                    <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        fullwidth
                        value={password}
                        onChange={this.handlePassword}
                        placeholder={this.locale.t("common", "auth.password-placeholder")}
                    />
                </div>

                {submitError && (
                    <p className={styles["login__error"]} role="alert">
                        {submitError}
                    </p>
                )}

                <Button type="submit" fullwidth disabled={!canSubmit} aria-busy={isSubmitting}>
                    {isSubmitting ? this.locale.t("common", "auth.signing-in") : this.locale.t("common", "auth.sign-in")}
                </Button>

                <p className={styles["login__switch"]}>
                    {this.locale.t("common", "auth.no-account")}{" "}
                    <NavLink to="/register" baseClass={styles["login__link"]}>
                        {this.locale.t("common", "auth.sign-up")}
                    </NavLink>
                </p>
            </form>
        );
    }
}
