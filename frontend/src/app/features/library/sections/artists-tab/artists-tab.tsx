import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { FollowedArtistEntry } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";

import styles from "./artists-tab.module.scss";

interface Props {
    artists: FollowedArtistEntry[];
}

export class ArtistsTab extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { artists } = this.props;
        if (artists.length === 0) {
            return (
                <p className={styles["artists-tab__empty"]}>
                    {this.locale.t("common", "library.empty-artists")}
                </p>
            );
        }
        return (
            <ul className={styles["artists-tab__grid"]}>
                {artists.map((entry) => (
                    <li key={entry.id} className={styles["artists-tab__card"]}>
                        <div className={styles["artists-tab__avatar"]}>
                            {entry.artist.image && <img src={entry.artist.image} alt="" loading="lazy" />}
                        </div>
                        <span className={styles["artists-tab__name"]} title={entry.artist.name}>
                            {entry.artist.name}
                        </span>
                        <span className={styles["artists-tab__hint"]}>
                            {this.locale.t("common", "library.artist-hint")}
                        </span>
                    </li>
                ))}
            </ul>
        );
    }
}
