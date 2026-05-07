import { observer } from "mobx-react";
import { ChangeEvent, Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import { SVG_Devices } from "../svg/player/svg-devices";
import { SVG_HeartFilled } from "../svg/player/svg-heart-filled";
import { SVG_Heart } from "../svg/player/svg-heart";
import { SVG_Next } from "../svg/player/svg-next";
import { SVG_Pause } from "../svg/player/svg-pause";
import { SVG_Play } from "../svg/player/svg-play";
import { SVG_Prev } from "../svg/player/svg-prev";
import { SVG_Queue } from "../svg/player/svg-queue";
import { SVG_Repeat } from "../svg/player/svg-repeat";
import { SVG_RepeatOne } from "../svg/player/svg-repeat-one";
import { SVG_Shuffle } from "../svg/player/svg-shuffle";
import { SVG_Volume } from "../svg/player/svg-volume";
import { SVG_VolumeMute } from "../svg/player/svg-volume-mute";
import styles from "./bottom-player.module.scss";

const formatMs = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

@observer
export class BottomPlayer extends Component {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

    private handleSeek = (event: ChangeEvent<HTMLInputElement>): void => {
        this.player.seek(Number(event.target.value));
    };

    private handleVolume = (event: ChangeEvent<HTMLInputElement>): void => {
        this.player.setVolume(Number(event.target.value));
    };

    private handleHeart = (): void => {
        const track = this.player.currentTrack;
        if (!track || !this.auth.isAuthenticated) return;
        void this.library.toggleTrackSaved(track.id);
    };

    private renderRepeatIcon(): ReactNode {
        if (this.player.repeatMode === "one") return <SVG_RepeatOne />;
        return <SVG_Repeat />;
    }

    render(): ReactNode {
        const track = this.player.currentTrack;
        const duration = this.player.durationMs;
        const position = this.player.positionMs;
        const isMuted = this.player.isMuted || this.player.volume === 0;
        const playLabel = this.player.isPlaying
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        const playButtonClass = className(`${styles["bottom-player__btn"]} ${styles["bottom-player__btn--play"]}`, {
            [styles["bottom-player__btn--disabled"]]: !track,
        });

        return (
            <section
                className={styles["bottom-player"]}
                role="region"
                aria-label={this.locale.t("common", "player.aria-label")}
            >
                <div className={styles["bottom-player__left"]}>
                    <div className={styles["bottom-player__cover"]} aria-hidden={!track}>
                        {track?.cover && <img src={track.cover} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["bottom-player__meta"]}>
                        <span className={styles["bottom-player__title"]}>
                            {track?.title ?? this.locale.t("common", "player.empty-title")}
                        </span>
                        <span className={styles["bottom-player__artist"]}>
                            {track?.artist?.name ?? this.locale.t("common", "player.empty-artist")}
                        </span>
                    </div>
                    {this.auth.isAuthenticated && track && (
                        <button
                            type="button"
                            className={className(styles["bottom-player__btn"], {
                                [styles["bottom-player__btn--active"]]: this.library.isTrackSaved(
                                    track.id,
                                ),
                            })}
                            onClick={this.handleHeart}
                            aria-label={
                                this.library.isTrackSaved(track.id)
                                    ? this.locale.t("common", "player.unlike")
                                    : this.locale.t("common", "player.like")
                            }
                            aria-pressed={this.library.isTrackSaved(track.id)}
                        >
                            {this.library.isTrackSaved(track.id) ? <SVG_HeartFilled /> : <SVG_Heart />}
                        </button>
                    )}
                </div>

                <div className={styles["bottom-player__center"]}>
                    <div className={styles["bottom-player__controls"]}>
                        <button
                            type="button"
                            className={className(styles["bottom-player__btn"], {
                                [styles["bottom-player__btn--active"]]: this.player.shuffleEnabled,
                            })}
                            onClick={this.player.toggleShuffle}
                            aria-label={this.locale.t("common", "player.shuffle")}
                            aria-pressed={this.player.shuffleEnabled}
                        >
                            <SVG_Shuffle />
                        </button>
                        <button
                            type="button"
                            className={styles["bottom-player__btn"]}
                            onClick={this.player.prev}
                            aria-label={this.locale.t("common", "player.prev")}
                            disabled={!track}
                        >
                            <SVG_Prev />
                        </button>
                        <button
                            type="button"
                            className={playButtonClass}
                            onClick={this.player.togglePlay}
                            aria-label={playLabel}
                            disabled={!track}
                        >
                            {this.player.isPlaying ? <SVG_Pause /> : <SVG_Play />}
                        </button>
                        <button
                            type="button"
                            className={styles["bottom-player__btn"]}
                            onClick={this.player.next}
                            aria-label={this.locale.t("common", "player.next")}
                            disabled={!track && this.player.queue.length === 0}
                        >
                            <SVG_Next />
                        </button>
                        <button
                            type="button"
                            className={className(styles["bottom-player__btn"], {
                                [styles["bottom-player__btn--active"]]: this.player.repeatMode !== "off",
                            })}
                            onClick={this.player.cycleRepeat}
                            aria-label={this.locale.t("common", "player.repeat")}
                            aria-pressed={this.player.repeatMode !== "off"}
                        >
                            {this.renderRepeatIcon()}
                        </button>
                    </div>
                    <div className={styles["bottom-player__seek"]}>
                        <span className={styles["bottom-player__time"]}>{formatMs(position)}</span>
                        <input
                            type="range"
                            className={styles["bottom-player__slider"]}
                            min={0}
                            max={Math.max(duration, 1)}
                            step={1000}
                            value={Math.min(position, duration)}
                            onChange={this.handleSeek}
                            aria-label={this.locale.t("common", "player.seek")}
                            disabled={!track}
                        />
                        <span className={styles["bottom-player__time"]}>{formatMs(duration)}</span>
                    </div>
                </div>

                <div className={styles["bottom-player__right"]}>
                    <button
                        type="button"
                        className={className(styles["bottom-player__btn"], {
                            [styles["bottom-player__btn--active"]]: this.player.isQueueOpen,
                        })}
                        onClick={this.player.toggleQueue}
                        aria-label={this.locale.t("common", "player.queue")}
                        aria-pressed={this.player.isQueueOpen}
                    >
                        <SVG_Queue />
                    </button>
                    <button
                        type="button"
                        className={`${styles["bottom-player__btn"]} ${styles["bottom-player__devices"]}`}
                        aria-label={this.locale.t("common", "player.devices")}
                    >
                        <SVG_Devices />
                    </button>
                    <div className={styles["bottom-player__volume"]}>
                        <button
                            type="button"
                            className={styles["bottom-player__btn"]}
                            onClick={this.player.toggleMute}
                            aria-label={this.locale.t("common", "player.volume")}
                        >
                            {isMuted ? <SVG_VolumeMute /> : <SVG_Volume />}
                        </button>
                        <input
                            type="range"
                            className={styles["bottom-player__volume-slider"]}
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : this.player.volume}
                            onChange={this.handleVolume}
                            aria-label={this.locale.t("common", "player.volume-level")}
                        />
                    </div>
                </div>
            </section>
        );
    }
}
