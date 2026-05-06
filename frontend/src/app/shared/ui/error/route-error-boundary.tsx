import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import { Button } from "../buttons/button";
import styles from "./error-boundary.module.scss";

@observer
export class RouteErrorBoundary extends Component {
    locale: LocaleService = inject(LocaleService);

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = "/";
    };

    render(): ReactNode {
        const title: string = this.locale.t("error-boundary", "title");
        const description: string = this.locale.t("error-boundary", "description");
        const reload: string = this.locale.t("error-boundary", "reload");
        const goHome: string = this.locale.t("error-boundary", "go-home");

        return (
            <div className={styles["error-page"]}>
                <div className={styles["error-center"]}>
                    <h1 className={styles["title"]}>{title}</h1>
                    <p className={styles["description"]}>{description}</p>
                    <div className={styles["actions"]}>
                        <Button className={styles["action-btn"]} onClick={this.handleReload}>
                            {reload}
                        </Button>
                        <Button
                            buttonType="secondary"
                            className={styles["action-btn"]}
                            onClick={this.handleGoHome}
                        >
                            {goHome}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
