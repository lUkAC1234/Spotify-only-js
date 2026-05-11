import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Artist } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { highlightMatch } from "@/app/shared/utils/functions/highlight-match";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./artist-grid.module.scss";

interface Props {
    title: string;
    artists: Artist[];
    query: string;
}

export class ArtistGrid extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { title, artists, query } = this.props;
        if (artists.length === 0) return null;
        const roleLabel = this.locale.t("common", "artist.label");

        return (
            <section className={styles["artist-grid"]}>
                <header className={styles["artist-grid__header"]}>
                    <h2 className={styles["artist-grid__title"]}>{title}</h2>
                </header>
                <Carousel>
                    <ul className={styles["artist-grid__list"]} aria-label={title}>
                        {artists.map((artist) => (
                            <li key={artist.id} className={styles["artist-grid__card"]}>
                                <NavLink to={`/artist/${artist.id}`} baseClass={styles["artist-grid__link"]}>
                                    <div className={styles["artist-grid__avatar"]}>
                                        <Avatar name={artist.name} image={artist.image} />
                                    </div>
                                    <span className={styles["artist-grid__name"]} title={artist.name}>
                                        {highlightMatch(artist.name, query)}
                                    </span>
                                    <span className={styles["artist-grid__role"]}>{roleLabel}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </Carousel>
            </section>
        );
    }
}
