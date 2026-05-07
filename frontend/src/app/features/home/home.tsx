import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { TitleService } from "@/app/core/services/browser/title.service";
import { inject } from "@/app/shared/decorators/di";

import { HomeService } from "./home.service";
import styles from "./home.module.scss";
import { HomeAuth } from "./sections/home-auth/home-auth";
import { HomeGuest } from "./sections/home-guest/home-guest";

@observer
export class Home extends Component {
    private title: TitleService = inject(TitleService);
    private home: HomeService = inject(HomeService);
    private auth: AuthService = inject(AuthService);

    componentDidMount(): void {
        this.title.construct({ title: "Spotify", titleNamespace: "common", titleTKey: "page-title" });
        this.title.init();
        void this.home.load();
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    render(): ReactNode {
        return (
            <div className={styles["home"]}>
                {this.auth.isAuthenticated ? <HomeAuth /> : <HomeGuest />}
            </div>
        );
    }
}
