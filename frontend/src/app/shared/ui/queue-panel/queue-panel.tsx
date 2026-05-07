import { observer } from "mobx-react";
import { Component, DragEvent, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { SidePanel } from "@/app/shared/ui/side-panel/side-panel";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./queue-panel.module.scss";

const formatMs = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "0:00";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

@observer
export class QueuePanel extends Component {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    private dragIndex: number | null = null;

    private handleClose = (): void => {
        this.player.closeQueue();
    };

    private handleDragStart = (event: DragEvent<HTMLLIElement>, index: number): void => {
        this.dragIndex = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
    };

    private handleDragOver = (event: DragEvent<HTMLLIElement>): void => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    private handleDrop = (event: DragEvent<HTMLLIElement>, index: number): void => {
        event.preventDefault();
        const from = this.dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(from) && from !== index) {
            this.player.moveInQueue(from, index);
        }
        this.dragIndex = null;
    };

    private handleRemove = (index: number): void => {
        this.player.removeFromQueue(index);
    };

    private renderCurrent(track: Track): ReactNode {
        const cover = track.cover || track.album?.cover || "";
        return (
            <article
                className={styles["queue-panel__current"]}
                aria-label={this.locale.t("common", "player.now-playing")}
            >
                <div className={styles["queue-panel__cover"]}>
                    {cover && <img src={cover} alt="" loading="lazy" />}
                </div>
                <div className={styles["queue-panel__meta"]}>
                    <span className={styles["queue-panel__title"]}>{track.title}</span>
                    <span className={styles["queue-panel__artist"]}>{track.artist?.name ?? ""}</span>
                </div>
                <span className={styles["queue-panel__duration"]}>{formatMs(track.durationMs)}</span>
            </article>
        );
    }

    private renderQueueItem(track: Track, index: number): ReactNode {
        const cover = track.cover || track.album?.cover || "";
        return (
            <li
                key={`${track.id}-${index}`}
                className={styles["queue-panel__item"]}
                draggable
                onDragStart={(event) => this.handleDragStart(event, index)}
                onDragOver={this.handleDragOver}
                onDrop={(event) => this.handleDrop(event, index)}
            >
                <div className={styles["queue-panel__cover"]}>
                    {cover && <img src={cover} alt="" loading="lazy" />}
                </div>
                <div className={styles["queue-panel__meta"]}>
                    <span className={styles["queue-panel__title"]}>{track.title}</span>
                    <span className={styles["queue-panel__artist"]}>{track.artist?.name ?? ""}</span>
                </div>
                <button
                    type="button"
                    className={styles["queue-panel__remove"]}
                    onClick={() => this.handleRemove(index)}
                    aria-label={this.locale.t("common", "player.remove-from-queue")}
                >
                    <SVG_CloseIcon />
                </button>
            </li>
        );
    }

    render(): ReactNode {
        const { isQueueOpen, currentTrack, queue } = this.player;

        return (
            <SidePanel
                isOpen={isQueueOpen}
                title={this.locale.t("common", "player.queue-title")}
                onClose={this.handleClose}
                ariaLabel={this.locale.t("common", "player.queue-title")}
                closeAriaLabel={this.locale.t("common", "player.queue-close")}
            >
                <section className={styles["queue-panel__section"]}>
                    <h3 className={styles["queue-panel__section-title"]}>
                        {this.locale.t("common", "player.now-playing")}
                    </h3>
                    {currentTrack ? (
                        this.renderCurrent(currentTrack)
                    ) : (
                        <p className={styles["queue-panel__empty"]}>
                            {this.locale.t("common", "player.empty-title")}
                        </p>
                    )}
                </section>

                <section className={styles["queue-panel__section"]}>
                    <h3 className={styles["queue-panel__section-title"]}>
                        {this.locale.t("common", "player.next-up")}
                    </h3>
                    {queue.length === 0 ? (
                        <p className={styles["queue-panel__empty"]}>
                            {this.locale.t("common", "player.queue-empty")}
                        </p>
                    ) : (
                        <ul className={styles["queue-panel__list"]}>
                            {queue.map((track, index) => this.renderQueueItem(track, index))}
                        </ul>
                    )}
                </section>
            </SidePanel>
        );
    }
}
