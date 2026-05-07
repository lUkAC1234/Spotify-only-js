import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { useParams } from "react-router";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";

import { ArtistPageService } from "./artist.service";
import styles from "./artist.module.scss";
import { ArtistHero } from "./sections/artist-hero/artist-hero";
import { Discography } from "./sections/discography/discography";
import { RelatedArtists } from "./sections/related-artists/related-artists";
import { TopTracks } from "./sections/top-tracks/top-tracks";

interface Props {
    artistId: string;
}

@observer
class ArtistView extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: ArtistPageService = inject(ArtistPageService);
    private player: PlayerService = inject(PlayerService);

    componentDidMount(): void {
        this.title.construct({ title: "Artist", titleNamespace: "common", titleTKey: "artist.label" });
        this.title.init();
        void this.service.load(this.props.artistId);
    }

    componentDidUpdate(prev: Props): void {
        if (prev.artistId !== this.props.artistId) {
            void this.service.load(this.props.artistId);
        }
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    private handlePlay = (): void => {
        const detail = this.service.detail;
        if (!detail || detail.topTracks.length === 0) return;
        const [head, ...rest] = detail.topTracks;
        this.player.setQueue(rest);
        this.player.playTrack(head, { type: "artist", id: detail.id });
    };

    private handlePlayTrack = (track: Track): void => {
        const detail = this.service.detail;
        if (!detail) return;
        const startIndex = detail.topTracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? detail.topTracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "artist", id: detail.id });
    };

    render(): ReactNode {
        const detail = this.service.detail;

        if (this.service.isLoading && !detail) {
            return (
                <div className={styles["artist__notice"]}>
                    <p>{this.locale.t("common", "loading")}</p>
                </div>
            );
        }

        if (!detail) {
            return (
                <div className={styles["artist__notice"]}>
                    <p>{this.locale.t("common", "artist.not-found")}</p>
                </div>
            );
        }

        return (
            <div className={styles["artist"]}>
                <ArtistHero detail={detail} onPlay={this.handlePlay} />
                <TopTracks tracks={detail.topTracks} onPlay={this.handlePlayTrack} />
                <Discography albums={detail.albums} />
                <RelatedArtists artists={detail.relatedArtists} />
            </div>
        );
    }
}

export class Artist extends Component {
    render(): ReactNode {
        return <ArtistRouted />;
    }
}

const ArtistRouted = (): ReactNode => {
    const params = useParams();
    const artistId = params.artistId ?? "";
    if (!artistId) return null;
    return <ArtistView key={artistId} artistId={artistId} />;
};
