import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { LoadMoreButton } from "@/app/shared/ui/load-more-button/load-more-button";

import { AlbumGrid } from "../album-grid/album-grid";
import { ArtistGrid } from "../artist-grid/artist-grid";
import { TopResult } from "../top-result/top-result";
import { TrackList } from "../track-list/track-list";
import styles from "./results.module.scss";

const TOP_TRACK_LIMIT = 5;

@observer
export class Results extends Component {
    private locale: LocaleService = inject(LocaleService);
    private catalog: CatalogService = inject(CatalogService);
    private player: PlayerService = inject(PlayerService);

    private handlePlay = (track: Track, _index: number = 0): void => {
        const tracks = this.catalog.lastResult.tracks;
        const startIndex = tracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? tracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "search", id: this.catalog.lastQuery });
    };

    private handlePlayTopResult = (track: Track): void => {
        this.handlePlay(track, 0);
    };

    private handleLoadMore = (): void => {
        void this.catalog.loadMoreSearchTracks();
    };

    render(): ReactNode {
        const { tracks, artists, albums } = this.catalog.lastResult;
        const query = this.catalog.lastQuery;

        if (this.catalog.isSearching && tracks.length === 0 && artists.length === 0 && albums.length === 0) {
            return (
                <div className={styles["results__notice"]}>
                    <p className={styles["results__notice-text"]}>
                        {this.locale.t("common", "search.loading", { query })}
                    </p>
                </div>
            );
        }

        if (this.catalog.lastError) {
            return (
                <div className={styles["results__notice"]}>
                    <p className={styles["results__notice-text"]}>
                        {this.locale.t("common", "search.error")}
                    </p>
                </div>
            );
        }

        if (tracks.length === 0 && artists.length === 0 && albums.length === 0) {
            return (
                <div className={styles["results__notice"]}>
                    <p className={styles["results__notice-text"]}>
                        {this.locale.t("common", "search.no-results", { query })}
                    </p>
                </div>
            );
        }

        const topTrack = tracks[0] ?? null;
        const previewSongs = tracks.slice(0, TOP_TRACK_LIMIT);
        const moreSongs = tracks.slice(TOP_TRACK_LIMIT);
        const showMoreList = moreSongs.length > 0 || this.catalog.searchHasMore;

        return (
            <div className={styles["results"]}>
                {topTrack && (
                    <div className={styles["results__row"]}>
                        <div className={styles["results__top"]}>
                            <TopResult track={topTrack} query={query} onPlay={this.handlePlayTopResult} />
                        </div>
                        <div className={styles["results__songs"]}>
                            <TrackList
                                title={this.locale.t("common", "search.songs")}
                                tracks={previewSongs}
                                query={query}
                                onPlay={this.handlePlay}
                            />
                        </div>
                    </div>
                )}

                <ArtistGrid
                    title={this.locale.t("common", "search.artists")}
                    artists={artists}
                    query={query}
                />

                <AlbumGrid
                    title={this.locale.t("common", "search.albums")}
                    albums={albums}
                    query={query}
                />

                {showMoreList && (
                    <>
                        <TrackList
                            title={this.locale.t("common", "search.all-songs", {
                                count: this.catalog.searchTotalTracks,
                            })}
                            tracks={moreSongs}
                            query={query}
                            onPlay={this.handlePlay}
                        />
                        {this.catalog.searchHasMore && (
                            <LoadMoreButton
                                onClick={this.handleLoadMore}
                                isLoading={this.catalog.isLoadingMore}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }
}
