import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { PlaybackContext, Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./track-card.module.scss";

interface Props {
    track: Track;
    queue: Track[];
    context: PlaybackContext;
}

@observer
export class TrackCard extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    private handlePlay = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        const { track, queue, context } = this.props;
        if (this.player.currentTrack?.id === track.id) {
            this.player.togglePlay();
            return;
        }
        const startIndex = queue.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? queue.slice(startIndex + 1) : queue.filter((t) => t.id !== track.id);
        this.player.setQueue(upcoming);
        this.player.playTrack(track, context);
    };

    render(): ReactNode {
        const { track } = this.props;
        const cover = track.cover || track.album?.cover || "";
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        return (
            <li
                className={className(styles["track-card"], {
                    [styles["track-card--current"]]: isCurrent,
                })}
            >
                <div className={styles["track-card__cover"]}>
                    {cover && <img src={cover} alt="" loading="lazy" />}
                    <button
                        type="button"
                        className={styles["track-card__play"]}
                        onClick={this.handlePlay}
                        aria-label={`${playLabel}: ${track.title}`}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>
                <span className={styles["track-card__title"]} title={track.title}>
                    {track.title}
                </span>
                <span className={styles["track-card__artist"]} title={track.artist?.name ?? ""}>
                    {track.artist?.name ?? ""}
                </span>
            </li>
        );
    }
}
