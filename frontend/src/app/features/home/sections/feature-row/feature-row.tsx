import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./feature-row.module.scss";

interface Props {
    title: string;
    tracks: Track[];
    contextId: string;
    placeholders?: number;
}

const PLACEHOLDER_COUNT = 6;

@observer
export class FeatureRow extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    private handlePlay = (track: Track, index: number): void => {
        if (this.player.currentTrack?.id === track.id) {
            this.player.togglePlay();
            return;
        }
        const upcoming = this.props.tracks.slice(index + 1);
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "playlist", id: this.props.contextId });
    };

    private renderSkeletons(): ReactNode {
        const count = this.props.placeholders ?? PLACEHOLDER_COUNT;
        return Array.from({ length: count }).map((_, index) => (
            <li key={`placeholder-${index}`} className={styles["feature-row__card"]} aria-hidden="true">
                <div className={styles["feature-row__cover"]} />
                <div className={styles["feature-row__line"]} />
                <div className={styles["feature-row__line-sm"]} />
            </li>
        ));
    }

    private renderTrackCard(track: Track, index: number): ReactNode {
        const isCurrent = this.player.currentTrack?.id === track.id;
        const isPlayingNow = isCurrent && this.player.isPlaying;
        const cover = track.cover || track.album?.cover || "";
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        const cardClass = className(styles["feature-row__card"], {
            [styles["feature-row__card--current"]]: isCurrent,
        });

        return (
            <li key={track.id} className={cardClass}>
                <div className={styles["feature-row__cover"]}>
                    {cover && <img src={cover} alt="" loading="lazy" />}
                    <button
                        type="button"
                        className={styles["feature-row__play"]}
                        onClick={() => this.handlePlay(track, index)}
                        aria-label={`${playLabel}: ${track.title}`}
                    >
                        {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                    </button>
                </div>
                <span className={styles["feature-row__title-track"]} title={track.title}>
                    {track.title}
                </span>
                <span className={styles["feature-row__artist"]} title={track.artist?.name ?? ""}>
                    {track.artist?.name ?? ""}
                </span>
            </li>
        );
    }

    render(): ReactNode {
        const { title, tracks } = this.props;
        const hasTracks = tracks.length > 0;

        return (
            <section className={styles["feature-row"]}>
                <header className={styles["feature-row__header"]}>
                    <h2 className={styles["feature-row__title"]}>{title}</h2>
                </header>
                <ul className={styles["feature-row__list"]} aria-label={title}>
                    {hasTracks
                        ? tracks.map((track, index) => this.renderTrackCard(track, index))
                        : this.renderSkeletons()}
                </ul>
            </section>
        );
    }
}
