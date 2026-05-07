import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { Artist } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";

import styles from "./artist-card.module.scss";

interface Props {
    artist: Artist;
    fallbackIndex?: number;
}

export class ArtistCard extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);

    private handleClick = (): void => {
        this.navigate.navigate(`/artist/${this.props.artist.id}`);
    };

    private handleKey = (event: React.KeyboardEvent<HTMLLIElement>): void => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.handleClick();
        }
    };

    render(): ReactNode {
        const { artist, fallbackIndex } = this.props;
        const fallbackClass = `gradient-${(fallbackIndex ?? artist.id) % 6}`;
        return (
            <li
                className={styles["artist-card"]}
                role="link"
                tabIndex={0}
                onClick={this.handleClick}
                onKeyDown={this.handleKey}
                aria-label={artist.name}
            >
                <div className={styles["artist-card__cover"]} data-fallback={fallbackClass}>
                    {artist.image ? (
                        <img src={artist.image} alt="" loading="lazy" />
                    ) : (
                        <span className={styles["artist-card__placeholder"]} aria-hidden="true">
                            {artist.name.slice(0, 1).toUpperCase()}
                        </span>
                    )}
                </div>
                <span className={styles["artist-card__name"]} title={artist.name}>
                    {artist.name}
                </span>
                <span className={styles["artist-card__role"]}>
                    {this.locale.t("common", "artist.label")}
                </span>
            </li>
        );
    }
}
