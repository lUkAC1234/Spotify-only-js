import { Component, ReactNode } from "react";

import { Artist } from "@/app/core/types/artist";
import { highlightMatch } from "@/app/shared/utils/functions/highlight-match";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./artist-grid.module.scss";

interface Props {
    title: string;
    artists: Artist[];
    query: string;
}

export class ArtistGrid extends Component<Props> {
    render(): ReactNode {
        const { title, artists, query } = this.props;
        if (artists.length === 0) return null;

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
                                        {artist.image && <img src={artist.image} alt="" loading="lazy" />}
                                    </div>
                                    <span className={styles["artist-grid__name"]} title={artist.name}>
                                        {highlightMatch(artist.name, query)}
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
