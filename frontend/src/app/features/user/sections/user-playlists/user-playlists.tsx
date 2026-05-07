import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlaylistSummary } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./user-playlists.module.scss";

interface Props {
    playlists: PlaylistSummary[];
}

export class UserPlaylists extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { playlists } = this.props;
        return (
            <section className={styles["section"]}>
                <header className={styles["section__header"]}>
                    <h2 className={styles["section__title"]}>
                        {this.locale.t("common", "profile.public-playlists")}
                    </h2>
                </header>
                {playlists.length === 0 ? (
                    <p className={styles["section__empty"]}>
                        {this.locale.t("common", "profile.empty-playlists")}
                    </p>
                ) : (
                    <ul className={styles["section__grid"]}>
                        {playlists.map((playlist) => (
                            <li key={playlist.id} className={styles["section__card"]}>
                                <NavLink
                                    to={`/playlist/${playlist.id}`}
                                    baseClass={styles["section__link"]}
                                >
                                    <div className={styles["section__cover"]}>
                                        {playlist.cover && <img src={playlist.cover} alt="" loading="lazy" />}
                                    </div>
                                    <span className={styles["section__name"]} title={playlist.title}>
                                        {playlist.title}
                                    </span>
                                    <span className={styles["section__meta"]}>
                                        {this.locale.t("common", "playlist.tracks-count", {
                                            count: playlist.totalTracks,
                                        })}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        );
    }
}
