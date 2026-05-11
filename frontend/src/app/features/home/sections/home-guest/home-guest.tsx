import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import { HomeService } from "../../home.service";
import { ArtistCard } from "../artist-card/artist-card";
import { SectionRow } from "../section-row/section-row";
import { SkeletonCard } from "../track-card/skeleton-card";
import { TrackCard } from "../track-card/track-card";

import styles from "./home-guest.module.scss";

const SKELETON_COUNT = 6;

@observer
export class HomeGuest extends Component {
    private locale: LocaleService = inject(LocaleService);
    private home: HomeService = inject(HomeService);

    private renderSkeletons(): ReactNode {
        return Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
        ));
    }

    render(): ReactNode {
        const { popular, popularArtists } = this.home;
        const tracks = popular.slice(0, 12);

        return (
            <div className={styles["home-guest"]}>
                <SectionRow
                    title={this.locale.t("common", "popular.tracks")}
                    showAllHref="/search"
                >
                    {tracks.length === 0
                        ? this.renderSkeletons()
                        : tracks.map((track) => (
                              <TrackCard
                                  key={`popular-${track.id}`}
                                  track={track}
                                  queue={tracks}
                                  context={{ type: "playlist", id: "popular.tracks" }}
                              />
                          ))}
                </SectionRow>

                <SectionRow
                    title={this.locale.t("common", "popular.artists")}
                    showAllHref="/search"
                >
                    {popularArtists.length === 0
                        ? this.renderSkeletons()
                        : popularArtists.map((artist) => (
                              <ArtistCard key={`artist-${artist.id}`} artist={artist} />
                          ))}
                </SectionRow>
            </div>
        );
    }
}
