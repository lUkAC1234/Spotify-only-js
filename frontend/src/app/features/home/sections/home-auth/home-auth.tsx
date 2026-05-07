import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";

import { HomeService } from "../../home.service";
import { Greeting } from "../greeting/greeting";
import { PlaylistCard } from "../playlist-card/playlist-card";
import { SectionRow } from "../section-row/section-row";
import { SkeletonCard } from "../track-card/skeleton-card";
import { TrackCard } from "../track-card/track-card";

import styles from "./home-auth.module.scss";

const SKELETON_COUNT = 6;

@observer
export class HomeAuth extends Component {
    private locale: LocaleService = inject(LocaleService);
    private home: HomeService = inject(HomeService);

    private renderSkeletonItems(): ReactNode {
        return Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
        ));
    }

    private renderTrackList(tracks: Track[], contextId: string): ReactNode {
        if (tracks.length === 0) return this.renderSkeletonItems();
        return tracks.map((track) => (
            <TrackCard
                key={`${contextId}-${track.id}`}
                track={track}
                queue={tracks}
                context={{ type: "playlist", id: contextId }}
            />
        ));
    }

    render(): ReactNode {
        const { recentlyPlayed, madeForYou, newReleases, featuredPlaylists, recommendations, popular } = this.home;

        return (
            <div className={styles["home-auth"]}>
                <Greeting />
                <div className={styles["home-auth__sections"]}>
                    {recentlyPlayed.length > 0 && (
                        <SectionRow
                            title={this.locale.t("common", "home.recently-played")}
                            showAllHref="/library"
                        >
                            {this.renderTrackList(recentlyPlayed, "home.recently-played")}
                        </SectionRow>
                    )}

                    <SectionRow
                        title={this.locale.t("common", "home.made-for-you")}
                        showAllHref="/library"
                    >
                        {this.renderTrackList(madeForYou, "home.made-for-you")}
                    </SectionRow>

                    <SectionRow
                        title={this.locale.t("common", "home.new-releases")}
                        showAllHref="/search"
                    >
                        {this.renderTrackList(newReleases, "home.new-releases")}
                    </SectionRow>

                    <SectionRow
                        title={this.locale.t("common", "home.featured-playlists")}
                        showAllHref="/search"
                    >
                        {featuredPlaylists.length === 0
                            ? this.renderSkeletonItems()
                            : featuredPlaylists.map((playlist) => (
                                  <PlaylistCard key={playlist.id} playlist={playlist} />
                              ))}
                    </SectionRow>

                    <SectionRow
                        title={this.locale.t("common", "home.trending")}
                        showAllHref="/search"
                    >
                        {this.renderTrackList(recommendations.length > 0 ? recommendations : popular, "home.trending")}
                    </SectionRow>
                </div>
            </div>
        );
    }
}
