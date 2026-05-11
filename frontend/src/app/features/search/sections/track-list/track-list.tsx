import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { highlightMatch } from "@/app/shared/utils/functions/highlight-match";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";
import { SVG_Heart } from "@/app/shared/ui/svg/player/svg-heart";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./track-list.module.scss";

interface Props {
    title: string;
    tracks: Track[];
    query: string;
    onPlay: (track: Track, index: number) => void;
}

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

@observer
export class TrackList extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

    private renderRow = (track: Track, index: number): ReactNode => {
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const cover = track.cover || track.album?.cover || "";
        const isLiked = this.library.isTrackSaved(track.id);
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");
        const heartLabel = isLiked
            ? this.locale.t("common", "player.unlike")
            : this.locale.t("common", "player.like");

        return (
            <li
                key={track.id}
                className={className(styles["track-list__row"], {
                    [styles["track-list__row--current"]]: isCurrent,
                })}
            >
                <div className={styles["track-list__index"]}>
                    <span className={styles["track-list__index-number"]}>{index + 1}</span>
                    <button
                        type="button"
                        className={styles["track-list__index-play"]}
                        onClick={() =>
                            isCurrent ? this.player.togglePlay() : this.props.onPlay(track, index)
                        }
                        aria-label={playLabel}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>
                <div className={styles["track-list__main"]}>
                    <div className={styles["track-list__cover"]}>
                        {cover && <img src={cover} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["track-list__meta"]}>
                        <span className={styles["track-list__title"]}>
                            {highlightMatch(track.title, this.props.query)}
                        </span>
                        <span className={styles["track-list__artist"]}>
                            {highlightMatch(track.artist?.name ?? "", this.props.query)}
                        </span>
                    </div>
                </div>
                <div className={styles["track-list__album"]}>{track.album?.title ?? ""}</div>
                <div className={styles["track-list__duration"]}>
                    {this.auth.isAuthenticated && (
                        <button
                            type="button"
                            className={className(styles["track-list__heart"], {
                                [styles["track-list__heart--active"]]: isLiked,
                            })}
                            onClick={() => void this.library.toggleTrackSaved(track.id, track)}
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
                    <span>{formatDuration(track.durationMs)}</span>
                </div>
            </li>
        );
    };

    render(): ReactNode {
        const { title, tracks } = this.props;
        if (tracks.length === 0) return null;
        return (
            <section className={styles["track-list"]}>
                <header className={styles["track-list__header"]}>
                    <h2 className={styles["track-list__title-section"]}>{title}</h2>
                </header>
                <ul className={styles["track-list__rows"]} aria-label={title}>
                    {tracks.map(this.renderRow)}
                </ul>
            </section>
        );
    }
}
