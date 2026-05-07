import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { useParams } from "react-router";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";

import { AlbumPageService } from "./album.service";
import styles from "./album.module.scss";
import { AlbumHero } from "./sections/album-hero/album-hero";
import { AlbumTrackList } from "./sections/album-track-list/album-track-list";
import { RelatedAlbums } from "./sections/related-albums/related-albums";

interface Props {
    albumId: string;
}

@observer
class AlbumView extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: AlbumPageService = inject(AlbumPageService);
    private player: PlayerService = inject(PlayerService);

    componentDidMount(): void {
        this.title.construct({ title: "Album", titleNamespace: "common", titleTKey: "album.label" });
        this.title.init();
        void this.service.load(this.props.albumId);
    }

    componentDidUpdate(prev: Props): void {
        if (prev.albumId !== this.props.albumId) {
            void this.service.load(this.props.albumId);
        }
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    private handlePlayAll = (): void => {
        const detail = this.service.detail;
        if (!detail || detail.tracks.length === 0) return;
        const [head, ...rest] = detail.tracks;
        this.player.setQueue(rest);
        this.player.playTrack(head, { type: "album", id: detail.id });
    };

    private handlePlayTrack = (track: Track): void => {
        const detail = this.service.detail;
        if (!detail) return;
        const startIndex = detail.tracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? detail.tracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "album", id: detail.id });
    };

    render(): ReactNode {
        const detail = this.service.detail;

        if (this.service.isLoading && !detail) {
            return (
                <div className={styles["album__notice"]}>
                    <p>{this.locale.t("common", "loading")}</p>
                </div>
            );
        }

        if (!detail) {
            return (
                <div className={styles["album__notice"]}>
                    <p>{this.locale.t("common", "album.not-found")}</p>
                </div>
            );
        }

        return (
            <div className={styles["album"]}>
                <AlbumHero detail={detail} onPlay={this.handlePlayAll} />
                <AlbumTrackList tracks={detail.tracks} onPlay={this.handlePlayTrack} />
                <RelatedAlbums albums={detail.relatedAlbums} />
            </div>
        );
    }
}

export class Album extends Component {
    render(): ReactNode {
        return <AlbumRouted />;
    }
}

const AlbumRouted = (): ReactNode => {
    const params = useParams();
    const albumId = params.albumId ?? "";
    if (!albumId) return null;
    return <AlbumView key={albumId} albumId={albumId} />;
};
