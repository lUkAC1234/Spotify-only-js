import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { SavedAlbumEntry } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./albums-tab.module.scss";

interface Props {
    albums: SavedAlbumEntry[];
}

export class AlbumsTab extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { albums } = this.props;
        if (albums.length === 0) {
            return (
                <p className={styles["albums-tab__empty"]}>
                    {this.locale.t("common", "library.empty-albums")}
                </p>
            );
        }
        return (
            <ul className={styles["albums-tab__grid"]}>
                {albums.map((entry) => (
                    <li key={entry.id} className={styles["albums-tab__card"]}>
                        <NavLink
                            to={`/album/${entry.album.id}`}
                            baseClass={styles["albums-tab__link"]}
                            aria-label={entry.album.title}
                        >
                            <div className={styles["albums-tab__cover"]}>
                                {entry.album.cover && <img src={entry.album.cover} alt="" loading="lazy" />}
                            </div>
                            <span className={styles["albums-tab__title"]} title={entry.album.title}>
                                {entry.album.title}
                            </span>
                            <span className={styles["albums-tab__artist"]}>
                                {entry.album.artist?.name ?? ""}
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        );
    }
}
