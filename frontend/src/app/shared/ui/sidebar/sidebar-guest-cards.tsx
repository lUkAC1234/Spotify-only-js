import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./sidebar-guest-cards.module.scss";

@observer
export class SidebarGuestCards extends Component {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);

    private handleCreatePlaylist = (): void => {
        this.navigate.navigate("/login");
    };

    private handleBrowsePodcasts = (): void => {
        this.navigate.navigate("/search");
    };

    render(): ReactNode {
        return (
            <div className={styles["cards"]}>
                <article className={styles["card"]}>
                    <h3 className={styles["card__title"]}>
                        {this.locale.t("common", "sidebar.guest.playlist-title")}
                    </h3>
                    <p className={styles["card__sub"]}>
                        {this.locale.t("common", "sidebar.guest.playlist-sub")}
                    </p>
                    <button type="button" className={styles["card__cta"]} onClick={this.handleCreatePlaylist}>
                        {this.locale.t("common", "sidebar.guest.playlist-cta")}
                    </button>
                </article>
                <article className={styles["card"]}>
                    <h3 className={styles["card__title"]}>
                        {this.locale.t("common", "sidebar.guest.podcasts-title")}
                    </h3>
                    <p className={styles["card__sub"]}>
                        {this.locale.t("common", "sidebar.guest.podcasts-sub")}
                    </p>
                    <button type="button" className={styles["card__cta"]} onClick={this.handleBrowsePodcasts}>
                        {this.locale.t("common", "sidebar.guest.podcasts-cta")}
                    </button>
                </article>
            </div>
        );
    }
}
