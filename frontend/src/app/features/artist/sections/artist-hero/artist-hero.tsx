import { observer } from "mobx-react";
import { Component, ReactNode, RefObject, createRef } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { ArtistDetail } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { SVG_More } from "@/app/shared/ui/svg/nav/svg-more";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import { ArtistAboutModal } from "../artist-about-modal/artist-about-modal";
import { ArtistContextMenu } from "../artist-context-menu/artist-context-menu";
import styles from "./artist-hero.module.scss";

interface Props {
    detail: ArtistDetail;
    onPlay: () => void;
}

interface State {
    menuOpen: boolean;
    aboutOpen: boolean;
}

const formatListeners = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
};

@observer
export class ArtistHero extends Component<Props, State> {
    private locale: LocaleService = inject(LocaleService);
    private library: LibraryService = inject(LibraryService);
    private auth: AuthService = inject(AuthService);

    state: State = { menuOpen: false, aboutOpen: false };
    private moreRef: RefObject<HTMLButtonElement | null> = createRef();

    private handleFollow = (): void => {
        if (!this.auth.isAuthenticated) return;
        void this.library.toggleArtistFollowed(this.props.detail.id, this.props.detail);
    };

    private toggleMenu = (): void => {
        this.setState((prev) => ({ menuOpen: !prev.menuOpen }));
    };

    private closeMenu = (): void => {
        this.setState({ menuOpen: false });
    };

    private openAbout = (): void => {
        this.setState({ menuOpen: false, aboutOpen: true });
    };

    private closeAbout = (): void => {
        this.setState({ aboutOpen: false });
    };

    render(): ReactNode {
        const { detail, onPlay } = this.props;
        const isFollowing = this.library.isArtistFollowed(detail.id);
        const listeners = detail.monthlyListeners > 0 ? detail.monthlyListeners : detail.totalTracks * 12;
        const followLabel = isFollowing
            ? this.locale.t("common", "artist.following")
            : this.locale.t("common", "artist.follow");

        return (
            <header className={styles["hero"]}>
                {detail.image && (
                    <img
                        className={styles["hero__backdrop"]}
                        src={detail.image}
                        alt=""
                        loading="lazy"
                        aria-hidden="true"
                    />
                )}
                <div className={styles["hero__shade"]} aria-hidden="true" />
                <div className={styles["hero__inner"]}>
                    <div className={styles["hero__avatar"]}>
                        <Avatar name={detail.name} image={detail.image} />
                    </div>
                    <div className={styles["hero__meta"]}>
                        <span className={styles["hero__overline"]}>
                            {this.locale.t("common", "artist.label")}
                        </span>
                        <h1 className={styles["hero__name"]}>{detail.name}</h1>
                        <div className={styles["hero__line"]}>
                            <span>
                                {this.locale.t("common", "artist.monthly-listeners", {
                                    count: formatListeners(listeners),
                                })}
                            </span>
                            {detail.country && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span>{detail.country}</span>
                                </>
                            )}
                        </div>
                        <div className={styles["hero__actions"]}>
                            <button
                                type="button"
                                className={styles["hero__play"]}
                                onClick={onPlay}
                                disabled={detail.topTracks.length === 0}
                                aria-label={this.locale.t("common", "player.play")}
                            >
                                <SVG_Play />
                            </button>
                            {this.auth.isAuthenticated && (
                                <button
                                    type="button"
                                    className={className(styles["hero__follow"], {
                                        [styles["hero__follow--active"]]: isFollowing,
                                        [styles["hero__follow--busy"]]: this.library.isArtistBusy(detail.id),
                                    })}
                                    onClick={this.handleFollow}
                                    aria-pressed={isFollowing}
                                    aria-busy={this.library.isArtistBusy(detail.id)}
                                >
                                    {this.library.isArtistBusy(detail.id) ? (
                                        <Spinner size="sm" tone="current" inline />
                                    ) : (
                                        followLabel
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                ref={this.moreRef}
                                className={styles["hero__more"]}
                                onClick={this.toggleMenu}
                                aria-haspopup="menu"
                                aria-expanded={this.state.menuOpen}
                                aria-label={this.locale.t("common", "artist-menu.more-aria")}
                            >
                                <SVG_More />
                            </button>
                        </div>
                    </div>
                </div>

                <ArtistContextMenu
                    detail={detail}
                    isOpen={this.state.menuOpen}
                    anchorRef={this.moreRef}
                    onClose={this.closeMenu}
                    onOpenAbout={this.openAbout}
                />
                <ArtistAboutModal
                    detail={detail}
                    isOpen={this.state.aboutOpen}
                    onClose={this.closeAbout}
                />
            </header>
        );
    }
}
