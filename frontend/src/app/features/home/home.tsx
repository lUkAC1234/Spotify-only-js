import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import { HomeService } from "./home.service";
import styles from "./home.module.scss";
import { FeatureRow } from "./sections/feature-row/feature-row";
import { Greeting } from "./sections/greeting/greeting";

@observer
export class Home extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private home: HomeService = inject(HomeService);

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
                <Greeting />
                <div className={styles["home__sections"]}>
                    <FeatureRow
                        contextId="home.popular"
                        title={this.locale.t("common", "home.recently-played")}
                        tracks={this.home.popular}
                    />
                    <FeatureRow
                        contextId="home.made-for-you"
                        title={this.locale.t("common", "home.made-for-you")}
                        tracks={this.home.madeForYou}
                    />
                    <FeatureRow
                        contextId="home.new-releases"
                        title={this.locale.t("common", "home.new-releases")}
                        tracks={this.home.newReleases}
                    />
                    <FeatureRow
                        contextId="home.featured"
                        title={this.locale.t("common", "home.featured-playlists")}
                        tracks={this.home.featured}
                    />
                </div>
            </div>
        );
    }
}
