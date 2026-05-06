import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { TrackRow } from "@/app/shared/ui/track-row/track-row";

import styles from "./results.module.scss";

@observer
export class Results extends Component {
    private locale: LocaleService = inject(LocaleService);
    private catalog: CatalogService = inject(CatalogService);
    private player: PlayerService = inject(PlayerService);

    private handlePlay = (track: Track): void => {
        const tracks = this.catalog.lastResult.tracks;
        const startIndex = tracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? tracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "search", id: this.catalog.lastQuery });
    };

    render(): ReactNode {
        const { tracks, artists, albums } = this.catalog.lastResult;
        const query = this.catalog.lastQuery;

        if (!query) {
            return (
                <div className={styles["results__empty"]}>
                    <p className={styles["results__empty-text"]}>
                        {this.locale.t("common", "search.empty")}
                    </p>
                </div>
            );
        }

        if (this.catalog.isSearching && tracks.length === 0) {
            return (
                <div className={styles["results__empty"]}>
                    <p className={styles["results__empty-text"]}>
                        {this.locale.t("common", "search.loading", { query })}
                    </p>
                </div>
            );
        }

        if (this.catalog.lastError) {
            return (
                <div className={styles["results__empty"]}>
                    <p className={styles["results__empty-text"]}>
                        {this.locale.t("common", "search.error")}
                    </p>
                </div>
            );
        }

        if (tracks.length === 0 && artists.length === 0 && albums.length === 0) {
            return (
                <div className={styles["results__empty"]}>
                    <p className={styles["results__empty-text"]}>
                        {this.locale.t("common", "search.no-results", { query })}
                    </p>
                </div>
            );
        }

        return (
            <div className={styles["results"]}>
                {tracks.length > 0 && (
                    <section className={styles["results__section"]}>
                        <h2 className={styles["results__title"]}>
                            {this.locale.t("common", "search.tracks")}
                        </h2>
                        <ul className={styles["results__list"]}>
                            {tracks.map((track, index) => (
                                <TrackRow
                                    key={track.id}
                                    track={track}
                                    index={index}
                                    onPlay={this.handlePlay}
                                />
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        );
    }
}
