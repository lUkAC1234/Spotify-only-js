import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";
import { ThemeToggleBtn } from "@/app/shared/ui/buttons/theme-toggle-btn";
import { LangSelect } from "@/app/shared/ui/lang/lang-select";

import styles from "./404.module.scss";
import { Error404Service } from "./404.service";

@observer
export class Error404 extends Component<{
    minimal?: boolean;
}> {
    locale: LocaleService = inject(LocaleService);
    service: Error404Service = inject(Error404Service);

    componentDidMount(): void {
        this.service.init();
    }

    componentWillUnmount(): void {
        this.service.dispose();
    }

    render(): ReactNode {
        return (
            <div className={styles["error-page"]}>
                {!this.props.minimal && (
                    <div className={styles["controls"]}>
                        <LangSelect mini />
                        <ThemeToggleBtn />
                    </div>
                )}
                <div className={styles["error-center"]}>
                    <span className={styles["digit"]}>404</span>
                    <p className={styles["description"]}>{this.locale.t("error404", "description")}</p>
                    <div className={styles["back-btn"]}>
                        <Button linkUrl="/">{this.locale.t("error404", "go-back")}</Button>
                    </div>
                </div>
            </div>
        );
    }
}
