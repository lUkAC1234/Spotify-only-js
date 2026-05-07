import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { AlbumDetail } from "@/app/core/types/album";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";
import { SVG_Heart } from "@/app/shared/ui/svg/player/svg-heart";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./album-hero.module.scss";

interface Props {
    detail: AlbumDetail;
    onPlay: () => void;
}

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "0 min";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours} h ${minutes} min`;
    return `${minutes} min`;
};

@observer
export class AlbumHero extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

    private handleSave = (): void => {
        if (!this.auth.isAuthenticated) return;
        void this.library.toggleAlbumSaved(this.props.detail.id);
    };

    render(): ReactNode {
        const { detail, onPlay } = this.props;
        const isSaved = this.library.isAlbumSaved(detail.id);
        const heartLabel = isSaved
            ? this.locale.t("common", "album.unsave")
            : this.locale.t("common", "album.save");

        return (
            <header className={styles["hero"]}>
                {detail.cover && (
                    <img
                        className={styles["hero__backdrop"]}
                        src={detail.cover}
                        alt=""
                        loading="lazy"
                        aria-hidden="true"
                    />
                )}
                <div className={styles["hero__shade"]} aria-hidden="true" />
                <div className={styles["hero__inner"]}>
                    <div className={styles["hero__cover"]}>
                        {detail.cover && <img src={detail.cover} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["hero__meta"]}>
                        <span className={styles["hero__overline"]}>
                            {this.locale.t("common", `artist.type-${detail.type}`)}
                        </span>
                        <h1 className={styles["hero__title"]}>{detail.title}</h1>
                        <div className={styles["hero__line"]}>
                            {detail.artist && (
                                <NavLink
                                    to={`/artist/${detail.artist.id}`}
                                    baseClass={styles["hero__artist"]}
                                >
                                    {detail.artist.name}
                                </NavLink>
                            )}
                            {detail.year && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span>{detail.year}</span>
                                </>
                            )}
                            <span aria-hidden="true">•</span>
                            <span>
                                {this.locale.t("common", "playlist.tracks-count", {
                                    count: detail.tracks.length,
                                })}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{formatDuration(detail.totalDurationMs)}</span>
                        </div>
                        <div className={styles["hero__actions"]}>
                            <button
                                type="button"
                                className={styles["hero__play"]}
                                onClick={onPlay}
                                disabled={detail.tracks.length === 0}
                            >
                                <SVG_Play />
                                <span>{this.locale.t("common", "player.play")}</span>
                            </button>
                            {this.auth.isAuthenticated && (
                                <button
                                    type="button"
                                    className={className(styles["hero__heart"], {
                                        [styles["hero__heart--active"]]: isSaved,
                                    })}
                                    onClick={this.handleSave}
                                    aria-label={heartLabel}
                                    aria-pressed={isSaved}
                                >
                                    {isSaved ? <SVG_HeartFilled /> : <SVG_Heart />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        );
    }
}
