import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlaylistSummary } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./playlists-tab.module.scss";

interface Props {
    playlists: PlaylistSummary[];
}

export class PlaylistsTab extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { playlists } = this.props;
        if (playlists.length === 0) {
            return (
                <p className={styles["playlists-tab__empty"]}>
                    {this.locale.t("common", "library.empty-playlists")}
                </p>
            );
        }
        return (
            <ul className={styles["playlists-tab__grid"]}>
                {playlists.map((playlist) => (
                    <li key={playlist.id} className={styles["playlists-tab__card"]}>
                        <NavLink
                            to={`/playlist/${playlist.id}`}
                            baseClass={styles["playlists-tab__link"]}
                        >
                            <div className={styles["playlists-tab__cover"]}>
                                {playlist.cover && <img src={playlist.cover} alt="" loading="lazy" />}
                            </div>
                            <div className={styles["playlists-tab__meta"]}>
                                <span className={styles["playlists-tab__title"]} title={playlist.title}>
                                    {playlist.title}
                                </span>
                                <span className={styles["playlists-tab__subtitle"]}>
                                    {playlist.owner.displayName}
                                </span>
                            </div>
                        </NavLink>
                    </li>
                ))}
            </ul>
        );
    }
}
