import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import { SVG_Pause } from "../svg/player/svg-pause";
import { SVG_Play } from "../svg/player/svg-play";
import styles from "./track-row.module.scss";

interface Props {
    track: Track;
    index: number;
    onPlay: (track: Track) => void;
}

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

@observer
export class TrackRow extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    private get isCurrent(): boolean {
        return this.player.currentTrack?.id === this.props.track.id;
    }

    private handleActivate = (): void => {
        if (this.isCurrent) {
            this.player.togglePlay();
            return;
        }
        this.props.onPlay(this.props.track);
    };

    render(): ReactNode {
        const { track, index } = this.props;
        const cover = track.cover || track.album?.cover || "";
        const isCurrent = this.isCurrent;
        const isPlaying = isCurrent && this.player.isPlaying;
        const playLabel = isPlaying
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        const rowClass = className(styles["track-row"], {
            [styles["track-row--current"]]: isCurrent,
        });

        return (
            <li className={rowClass}>
                <div className={styles["track-row__index"]}>
                    <span className={styles["track-row__index-number"]}>{index + 1}</span>
                    <button
                        type="button"
                        className={styles["track-row__index-play"]}
                        onClick={this.handleActivate}
                        aria-label={playLabel}
                    >
                        {isPlaying ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>

                <div className={styles["track-row__main"]}>
                    <div className={styles["track-row__cover"]}>
                        {cover && <img src={cover} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["track-row__meta"]}>
                        <span className={styles["track-row__title"]}>{track.title}</span>
                        <span className={styles["track-row__artist"]}>{track.artist?.name ?? ""}</span>
                    </div>
                </div>

                <div className={styles["track-row__album"]}>{track.album?.title ?? ""}</div>

                <div className={styles["track-row__duration"]}>{formatDuration(track.durationMs)}</div>
            </li>
        );
    }
}
