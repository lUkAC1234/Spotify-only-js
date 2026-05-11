import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Artist } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { Carousel } from "@/app/shared/ui/carousel/carousel";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./related-artists.module.scss";

interface Props {
    artists: Artist[];
}

export class RelatedArtists extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { artists } = this.props;
        if (artists.length === 0) return null;
        return (
            <section className={styles["related"]}>
                <header className={styles["related__header"]}>
                    <h2 className={styles["related__title"]}>
                        {this.locale.t("common", "artist.fans-also-like")}
                    </h2>
                </header>
                <Carousel>
                    <ul className={styles["related__list"]}>
                        {artists.map((artist) => (
                            <li key={artist.id} className={styles["related__card"]}>
                                <NavLink to={`/artist/${artist.id}`} baseClass={styles["related__link"]}>
                                    <div className={styles["related__avatar"]}>
                                        <Avatar name={artist.name} image={artist.image} />
                                    </div>
                                    <span className={styles["related__name"]} title={artist.name}>
                                        {artist.name}
                                    </span>
                                    <span className={styles["related__hint"]}>
                                        {this.locale.t("common", "artist.label")}
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
