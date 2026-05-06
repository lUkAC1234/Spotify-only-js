import { observer } from "mobx-react";
import { Component, ErrorInfo, PropsWithChildren, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";

import styles from "./error-boundary.module.scss";
import { ErrorBoundaryService } from "./error-boundary.service";

export type Props = PropsWithChildren<{
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}>;

@observer
export class ErrorBoundary extends Component<Props> {
    service: ErrorBoundaryService = inject(ErrorBoundaryService);
    locale: LocaleService = inject(LocaleService);

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.service.setErrorStatus(true, () => {
            this.props.onError?.(error, errorInfo);
        });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = "/";
    };

    render(): ReactNode {
        const { children } = this.props;

        if (!this.service.throwenError) {
            return children;
        }

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
