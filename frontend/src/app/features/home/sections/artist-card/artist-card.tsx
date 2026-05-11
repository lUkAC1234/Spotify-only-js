import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Artist } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./artist-card.module.scss";

interface Props {
    artist: Artist;
}

export class ArtistCard extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { artist } = this.props;
        return (
            <li className={styles["artist-card-item"]}>
                <NavLink
                    to={`/artist/${artist.id}`}
                    baseClass={styles["artist-card"]}
                    aria-label={artist.name}
                >
                    <div className={styles["artist-card__cover"]}>
                        <Avatar name={artist.name} image={artist.image} />
                    </div>
                    <span className={styles["artist-card__name"]} title={artist.name}>
                        {artist.name}
                    </span>
                    <span className={styles["artist-card__role"]}>
                        {this.locale.t("common", "artist.label")}
                    </span>
                </NavLink>
            </li>
        );
    }
}
