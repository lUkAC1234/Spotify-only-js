import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";
import { SVG_Heart } from "@/app/shared/ui/svg/player/svg-heart";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./album-track-list.module.scss";

interface Props {
    tracks: Track[];
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
export class AlbumTrackList extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

    private renderRow = (track: Track, index: number): ReactNode => {
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const isLiked = this.library.isTrackSaved(track.id);
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");
        const heartLabel = isLiked
            ? this.locale.t("common", "player.unlike")
            : this.locale.t("common", "player.like");
        const trackNumber = track.trackNumber ?? index + 1;

        return (
            <li
                key={track.id}
                className={className(styles["row"], {
                    [styles["row--current"]]: isCurrent,
                })}
            >
                <div className={styles["row__index"]}>
                    <span className={styles["row__index-number"]}>{trackNumber}</span>
                    <button
                        type="button"
                        className={styles["row__index-play"]}
                        onClick={() =>
                            isCurrent ? this.player.togglePlay() : this.props.onPlay(track)
                        }
                        aria-label={playLabel}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>
                <div className={styles["row__meta"]}>
                    <span className={styles["row__title"]}>{track.title}</span>
                    <span className={styles["row__artist"]}>{track.artist?.name ?? ""}</span>
                </div>
                <div className={styles["row__actions"]}>
                    {this.auth.isAuthenticated && (
                        <button
                            type="button"
                            className={className(styles["row__heart"], {
                                [styles["row__heart--active"]]: isLiked,
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
                    <span className={styles["row__duration"]}>{formatDuration(track.durationMs)}</span>
                </div>
            </li>
        );
    };

    render(): ReactNode {
        const { tracks } = this.props;
        if (tracks.length === 0) {
            return (
                <p className={styles["empty"]}>{this.locale.t("common", "playlist.empty-tracks")}</p>
            );
        }
        return (
            <section className={styles["track-list"]}>
                <header className={styles["track-list__header"]}>
                    <span className={styles["track-list__cell"]}>#</span>
                    <span className={styles["track-list__cell"]}>
                        {this.locale.t("common", "search.tracks-singular")}
                    </span>
                    <span className={styles["track-list__cell"]}>
                        {this.locale.t("common", "playlist.duration")}
                    </span>
                </header>
                <ul className={styles["track-list__rows"]}>{tracks.map(this.renderRow)}</ul>
            </section>
        );
    }
}
