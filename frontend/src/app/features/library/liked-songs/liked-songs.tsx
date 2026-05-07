import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { TitleService } from "@/app/core/services/browser/title.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./liked-songs.module.scss";

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

@observer
export class LikedSongs extends Component {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private library: LibraryService = inject(LibraryService);
    private player: PlayerService = inject(PlayerService);

    componentDidMount(): void {
        this.title.construct({
            title: "Liked Songs",
            titleNamespace: "common",
            titleTKey: "library.liked-songs",
        });
        this.title.init();
        if (this.auth.isAuthenticated) {
            void this.library.fetchSavedTracks(100);
        }
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    private get tracks(): Track[] {
        return this.library.savedTracks.map((entry) => entry.track);
    }

    private handlePlayAll = (): void => {
        const tracks = this.tracks;
        if (tracks.length === 0) return;
        const [head, ...rest] = tracks;
        this.player.setQueue(rest);
        this.player.playTrack(head, { type: "playlist", id: "library.liked" });
    };

    private handlePlayTrack = (track: Track): void => {
        const tracks = this.tracks;
        const startIndex = tracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? tracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "playlist", id: "library.liked" });
    };

    private renderRow = (track: Track, index: number): ReactNode => {
        const cover = track.cover || track.album?.cover || "";
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        return (
            <li
                key={track.id}
                className={className(styles["row"], {
                    [styles["row--current"]]: isCurrent,
                })}
            >
                <div className={styles["row__index"]}>
                    <span className={styles["row__index-number"]}>{index + 1}</span>
                    <button
                        type="button"
                        className={styles["row__index-play"]}
                        onClick={() =>
                            isCurrent ? this.player.togglePlay() : this.handlePlayTrack(track)
                        }
                        aria-label={playLabel}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>

                <div className={styles["row__main"]}>
                    <div className={styles["row__cover"]}>
                        {cover && <img src={cover} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["row__meta"]}>
                        <span className={styles["row__title"]}>{track.title}</span>
                        <span className={styles["row__artist"]}>{track.artist?.name ?? ""}</span>
                    </div>
                </div>

                <div className={styles["row__album"]}>{track.album?.title ?? ""}</div>
                <div className={styles["row__duration"]}>{formatDuration(track.durationMs)}</div>
            </li>
        );
    };

    render(): ReactNode {
        if (!this.auth.isAuthenticated) {
            return (
                <div className={styles["liked"]}>
                    <p className={styles["liked__notice"]}>
                        {this.locale.t("common", "library.signed-out-hint")}
                    </p>
                </div>
            );
        }

        const tracks = this.tracks;
        const totalDuration = tracks.reduce((sum, track) => sum + (track.durationMs || 0), 0);

        return (
            <div className={styles["liked"]}>
                <header className={styles["liked__header"]}>
                    <div className={styles["liked__cover"]}>
                        <SVG_HeartFilled />
                    </div>
                    <div className={styles["liked__meta"]}>
                        <span className={styles["liked__overline"]}>
                            {this.locale.t("common", "playlist.label")}
                        </span>
                        <h1 className={styles["liked__title"]}>
                            {this.locale.t("common", "library.liked-songs")}
                        </h1>
                        <p className={styles["liked__line"]}>
                            <span>{this.auth.me?.displayName ?? ""}</span>
                            <span aria-hidden="true">•</span>
                            <span>
                                {this.locale.t("common", "playlist.tracks-count", {
                                    count: tracks.length,
                                })}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{formatDuration(totalDuration)}</span>
                        </p>
                        <div className={styles["liked__actions"]}>
                            <button
                                type="button"
                                className={styles["liked__play"]}
                                onClick={this.handlePlayAll}
                                disabled={tracks.length === 0}
                            >
                                <SVG_Play />
                                <span>{this.locale.t("common", "player.play")}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {tracks.length === 0 ? (
                    <p className={styles["liked__empty"]}>
                        {this.locale.t("common", "library.empty-liked")}
                    </p>
                ) : (
                    <ul className={styles["liked__rows"]}>
                        {tracks.map((track, index) => this.renderRow(track, index))}
                    </ul>
                )}
            </div>
        );
    }
}
