import { observer } from "mobx-react";
import { Component, DragEvent, ReactNode } from "react";

import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { PlaylistDetail, PlaylistItem } from "@/app/core/types/playlist";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";
import { SVG_Heart } from "@/app/shared/ui/svg/player/svg-heart";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./playlist-track-list.module.scss";

interface Props {
    detail: PlaylistDetail;
    onPlayTrack: (track: Track) => void;
    onReorder: (itemId: number, toIndex: number) => Promise<void> | void;
    onRemove: (itemId: number) => Promise<void> | void;
}

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatRelative = (iso: string): string => {
    const ts = Date.parse(iso);
    if (Number.isNaN(ts)) return "";
    const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} wk ago`;
    if (days < 365) return `${Math.floor(days / 30)} mo ago`;
    return `${Math.floor(days / 365)} yr ago`;
};

@observer
export class PlaylistTrackList extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private library: LibraryService = inject(LibraryService);
    private player: PlayerService = inject(PlayerService);

    private dragIndex: number | null = null;

    private handleDragStart = (event: DragEvent<HTMLLIElement>, index: number): void => {
        this.dragIndex = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
    };

    private handleDragOver = (event: DragEvent<HTMLLIElement>): void => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    private handleDrop = (event: DragEvent<HTMLLIElement>, toIndex: number): void => {
        event.preventDefault();
        const fromIndex =
            this.dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(fromIndex) && fromIndex !== toIndex) {
            const item = this.props.detail.items[fromIndex];
            if (item) void this.props.onReorder(item.id, toIndex);
        }
        this.dragIndex = null;
    };

    private renderRow = (item: PlaylistItem, index: number): ReactNode => {
        const track = item.track;
        const cover = track.cover || track.album?.cover || "";
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const isLiked = this.library.isTrackSaved(track.id);
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");
        const heartLabel = isLiked
            ? this.locale.t("common", "player.unlike")
            : this.locale.t("common", "player.like");

        return (
            <li
                key={item.id}
                className={className(styles["row"], {
                    [styles["row--current"]]: isCurrent,
                })}
                draggable={this.props.detail.canEdit}
                onDragStart={(event) => this.handleDragStart(event, index)}
                onDragOver={this.handleDragOver}
                onDrop={(event) => this.handleDrop(event, index)}
            >
                <div className={styles["row__index"]}>
                    <span className={styles["row__index-number"]}>{index + 1}</span>
                    <button
                        type="button"
                        className={styles["row__index-play"]}
                        onClick={() =>
                            isCurrent ? this.player.togglePlay() : this.props.onPlayTrack(track)
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

                <div className={styles["row__added"]}>{formatRelative(item.addedAt)}</div>

                <div className={styles["row__actions"]}>
                    <button
                        type="button"
                        className={className(styles["row__icon-btn"], {
                            [styles["row__icon-btn--active"]]: isLiked,
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
                    {this.props.detail.canEdit && (
                        <button
                            type="button"
                            className={styles["row__icon-btn"]}
                            onClick={() => void this.props.onRemove(item.id)}
                            aria-label={this.locale.t("common", "playlist.remove-from-playlist")}
                        >
                            <SVG_CloseIcon />
                        </button>
                    )}
                    <span className={styles["row__duration"]}>{formatDuration(track.durationMs)}</span>
                </div>
            </li>
        );
    };

    render(): ReactNode {
        const items = this.props.detail.items;
        if (items.length === 0) {
            return (
                <p className={styles["empty"]}>{this.locale.t("common", "playlist.empty-tracks")}</p>
            );
        }
        return (
            <section className={styles["track-list"]}>
                <header className={styles["track-list__header"]}>
                    <span className={styles["track-list__heading-cell"]}>#</span>
                    <span className={styles["track-list__heading-cell"]}>
                        {this.locale.t("common", "search.tracks-singular")}
                    </span>
                    <span className={styles["track-list__heading-cell"]}>
                        {this.locale.t("common", "search.albums")}
                    </span>
                    <span className={styles["track-list__heading-cell"]}>
                        {this.locale.t("common", "playlist.added")}
                    </span>
                    <span className={styles["track-list__heading-cell"]}>
                        {this.locale.t("common", "playlist.duration")}
                    </span>
                </header>
                <ul className={styles["track-list__rows"]}>{items.map(this.renderRow)}</ul>
            </section>
        );
    }
}
