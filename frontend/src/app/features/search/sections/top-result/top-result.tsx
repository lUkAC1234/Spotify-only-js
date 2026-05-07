import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { highlightMatch } from "@/app/shared/utils/functions/highlight-match";
import { SVG_Pause } from "@/app/shared/ui/svg/player/svg-pause";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./top-result.module.scss";

interface Props {
    track: Track;
    query: string;
    onPlay: (track: Track) => void;
}

@observer
export class TopResult extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private player: PlayerService = inject(PlayerService);

    private get isCurrent(): boolean {
        return this.player.currentTrack?.id === this.props.track.id;
    }

    private handlePlay = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        if (this.isCurrent) {
            this.player.togglePlay();
            return;
        }
        this.props.onPlay(this.props.track);
    };

    render(): ReactNode {
        const { track, query } = this.props;
        const isPlayingNow = this.isCurrent && this.player.isPlaying;
        const cover = track.cover || track.album?.cover || "";
        const playLabel = isPlayingNow
            ? this.locale.t("common", "player.pause")
            : this.locale.t("common", "player.play");

        return (
            <article
                className={className(styles["top-result"], {
                    [styles["top-result--current"]]: this.isCurrent,
                })}
                aria-label={this.locale.t("common", "search.top-result")}
            >
                <header className={styles["top-result__header"]}>
                    <h3 className={styles["top-result__heading"]}>
                        {this.locale.t("common", "search.top-result")}
                    </h3>
                </header>
                <div className={styles["top-result__cover"]}>
                    {cover && <img src={cover} alt="" loading="lazy" />}
                </div>
                <div className={styles["top-result__title"]}>{highlightMatch(track.title, query)}</div>
                <div className={styles["top-result__meta"]}>
                    <span className={styles["top-result__pill"]}>
                        {this.locale.t("common", "search.tracks-singular")}
                    </span>
                    <span className={styles["top-result__artist"]}>
                        {highlightMatch(track.artist?.name ?? "", query)}
                    </span>
                </div>
                <button
                    type="button"
                    className={styles["top-result__play"]}
                    onClick={this.handlePlay}
                    aria-label={`${playLabel}: ${track.title}`}
                >
                    {isPlayingNow ? <SVG_Pause /> : <SVG_Play />}
                </button>
            </article>
        );
    }
}
