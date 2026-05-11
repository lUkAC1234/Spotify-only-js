import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import { Spinner } from "../loaders/spinner";
import { SourceBadge } from "../source-badge/source-badge";
import { SVG_HeartFilled } from "../svg/player/svg-heart-filled";
import { SVG_Heart } from "../svg/player/svg-heart";
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
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

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

    private handleHeart = (): void => {
        if (!this.auth.isAuthenticated) return;
        void this.library.toggleTrackSaved(this.props.track.id, this.props.track);
    };

    render(): ReactNode {
        const { track, index } = this.props;
        const cover = track.cover || track.album?.cover || "";
        const isCurrent = this.isCurrent;
        const isPlaying = isCurrent && this.player.isPlaying;
        const isLiked = this.library.isTrackSaved(track.id);
        const playLabel = isPlaying
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");
        const heartLabel = isLiked
            ? this.locale.t("common", "player.unlike")
            : this.locale.t("common", "player.like");

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
                        <span className={styles["track-row__artist"]}>
                            {track.artist?.name ?? ""}
                            {track.source && (
                                <SourceBadge
                                    source={track.source}
                                    className={styles["track-row__source"]}
                                />
                            )}
                        </span>
                    </div>
                </div>

                <div className={styles["track-row__album"]}>{track.album?.title ?? ""}</div>

                <div className={styles["track-row__actions"]}>
                    {this.auth.isAuthenticated && (
                        <button
                            type="button"
                            className={className(styles["track-row__heart"], {
                                [styles["track-row__heart--active"]]: isLiked,
                                [styles["track-row__heart--busy"]]: this.library.isTrackBusy(track.id),
                            })}
                            onClick={this.handleHeart}
                            aria-label={heartLabel}
                            aria-pressed={isLiked}
                            aria-busy={this.library.isTrackBusy(track.id)}
                        >
                            {this.library.isTrackBusy(track.id) ? (
                                <Spinner size="sm" tone="current" />
                            ) : isLiked ? (
                                <SVG_HeartFilled />
                            ) : (
                                <SVG_Heart />
                            )}
                        </button>
                    )}
                    <span className={styles["track-row__duration"]}>
                        {formatDuration(track.durationMs)}
                    </span>
                </div>
            </li>
        );
    }
}
