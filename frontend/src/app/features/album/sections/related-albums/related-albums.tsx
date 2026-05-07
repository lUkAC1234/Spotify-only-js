import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Album } from "@/app/core/types/album";
import { inject } from "@/app/shared/decorators/di";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./related-albums.module.scss";

interface Props {
    albums: Album[];
}

export class RelatedAlbums extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { albums } = this.props;
        if (albums.length === 0) return null;

        return (
            <section className={styles["related"]}>
                <header className={styles["related__header"]}>
                    <h2 className={styles["related__title"]}>
                        {this.locale.t("common", "album.related")}
                    </h2>
                </header>
                <Carousel>
                    <ul className={styles["related__list"]}>
                        {albums.map((album) => (
                            <li key={album.id} className={styles["related__card"]}>
                                <NavLink to={`/album/${album.id}`} baseClass={styles["related__link"]}>
                                    <div className={styles["related__cover"]}>
                                        {album.cover && <img src={album.cover} alt="" loading="lazy" />}
                                    </div>
                                    <span className={styles["related__name"]} title={album.title}>
                                        {album.title}
                                    </span>
                                    <span className={styles["related__artist"]}>
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
