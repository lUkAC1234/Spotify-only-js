import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./home.module.scss";

@observer
export class Home extends Component {
    private title: TitleService = inject(TitleService);

    componentDidMount(): void {
        this.title.construct({ title: "Spotify", titleNamespace: "common", titleTKey: "page-title" });
        this.title.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    render(): ReactNode {
        return (
            <main className={styles["home"]}>
                <h1 className={styles["title"]}>Hello World</h1>
            </main>
        );
    }
}
