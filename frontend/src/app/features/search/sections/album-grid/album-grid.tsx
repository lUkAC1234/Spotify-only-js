import { Component, ReactNode } from "react";

import { Album } from "@/app/core/types/album";
import { highlightMatch } from "@/app/shared/utils/functions/highlight-match";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./album-grid.module.scss";

interface Props {
    title: string;
    albums: Album[];
    query: string;
}

export class AlbumGrid extends Component<Props> {
    render(): ReactNode {
        const { title, albums, query } = this.props;
        if (albums.length === 0) return null;

        return (
            <section className={styles["album-grid"]}>
                <header className={styles["album-grid__header"]}>
                    <h2 className={styles["album-grid__title"]}>{title}</h2>
                </header>
                <Carousel>
                    <ul className={styles["album-grid__list"]} aria-label={title}>
                        {albums.map((album) => (
                            <li key={album.id} className={styles["album-grid__card"]}>
                                <NavLink to={`/album/${album.id}`} baseClass={styles["album-grid__link"]}>
                                    <div className={styles["album-grid__cover"]}>
                                        {album.cover && <img src={album.cover} alt="" loading="lazy" />}
                                    </div>
                                    <span className={styles["album-grid__name"]} title={album.title}>
                                        {highlightMatch(album.title, query)}
                                    </span>
                                    <span className={styles["album-grid__artist"]} title={album.artist?.name ?? ""}>
                                        {album.artist?.name ?? ""}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </Carousel>
            </section>
        );
    }
}
