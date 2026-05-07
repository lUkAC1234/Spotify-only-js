import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { FeaturedPlaylist } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./playlist-card.module.scss";

interface Props {
    playlist: FeaturedPlaylist;
}

@observer
export class PlaylistCard extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private catalog: CatalogService = inject(CatalogService);
    private player: PlayerService = inject(PlayerService);

    private get isCurrentContext(): boolean {
        const { context } = this.player;
        return context?.type === "playlist" && String(context.id) === String(this.props.playlist.id);
    }

    private handlePlay = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        event.stopPropagation();

        if (this.isCurrentContext) {
            this.player.togglePlay();
            return;
        }

        const detail = await this.catalog.getPlaylistDetail(this.props.playlist.id);
        if (!detail || detail.items.length === 0) return;
        const tracks = detail.items.map((item) => item.track);
        const [head, ...rest] = tracks;
        this.player.setQueue(rest);
        this.player.playTrack(head, { type: "playlist", id: this.props.playlist.id });
    };

    render(): ReactNode {
        const { playlist } = this.props;
        const isPlayingNow = this.isCurrentContext && this.player.isPlaying;
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        return (
            <li
                className={className(styles["playlist-card"], {
                    [styles["playlist-card--current"]]: this.isCurrentContext,
                })}
            >
                <div className={styles["playlist-card__cover"]}>
                    {playlist.cover && <img src={playlist.cover} alt="" loading="lazy" />}
                    <button
                        type="button"
                        className={styles["playlist-card__play"]}
                        onClick={this.handlePlay}
                        aria-label={`${playLabel}: ${playlist.title}`}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>
                <span className={styles["playlist-card__title"]} title={playlist.title}>
                    {playlist.title}
                </span>
                <span className={styles["playlist-card__subtitle"]} title={playlist.description}>
                    {playlist.description || playlist.ownerName}
                </span>
            </li>
        );
    }
}
