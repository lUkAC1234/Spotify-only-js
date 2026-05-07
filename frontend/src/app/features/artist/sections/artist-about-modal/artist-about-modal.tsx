import { Component, ReactNode, createRef } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { ArtistDetail } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./artist-about-modal.module.scss";

interface Props {
    detail: ArtistDetail;
    isOpen: boolean;
    onClose: () => void;
}

const formatListeners = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
};

export class ArtistAboutModal extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private panelRef = createRef<HTMLDivElement>();

    componentDidMount(): void {
        document.addEventListener("keydown", this.handleKey);
    }

    componentDidUpdate(prev: Props): void {
        if (!prev.isOpen && this.props.isOpen && this.panelRef.current) {
            this.panelRef.current.focus();
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleKey);
    }

    private handleKey = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.props.isOpen) {
            event.stopPropagation();
            this.props.onClose();
        }
    };

    private handleBackdrop = (event: React.MouseEvent<HTMLDivElement>): void => {
        if (event.target === event.currentTarget) this.props.onClose();
    };

    render(): ReactNode {
        if (!this.props.isOpen) return null;
        const { detail } = this.props;
        const listeners = detail.monthlyListeners > 0 ? detail.monthlyListeners : detail.totalTracks * 12;
        const genres = Array.from(new Set(detail.topTracks.flatMap((t) => t.genres))).slice(0, 6);

        return (
            <div className={styles["modal"]} role="dialog" aria-modal="true" onMouseDown={this.handleBackdrop}>
                <div
                    className={styles["modal__panel"]}
                    ref={this.panelRef}
                    tabIndex={-1}
                    aria-label={this.locale.t("common", "artist-about.title")}
                >
                    <header className={styles["modal__header"]}>
                        <h2 className={styles["modal__title"]}>
                            {this.locale.t("common", "artist-about.title")}
                        </h2>
                        <button
                            type="button"
                            className={styles["modal__close"]}
                            onClick={this.props.onClose}
                            aria-label={this.locale.t("common", "playlist.close")}
                        >
                            <SVG_CloseIcon />
                        </button>
                    </header>

                    <div className={styles["modal__body"]}>
                        {detail.image && (
                            <div className={styles["modal__cover"]}>
                                <img src={detail.image} alt="" loading="lazy" />
                            </div>
                        )}
                        <h3 className={styles["modal__name"]}>{detail.name}</h3>
                        <p className={styles["modal__listeners"]}>
                            {formatListeners(listeners)} {this.locale.t("common", "artist-about.monthly-listeners")}
                        </p>

                        {detail.country && (
                            <dl className={styles["modal__row"]}>
                                <dt className={styles["modal__label"]}>
                                    {this.locale.t("common", "artist-about.country")}
                                </dt>
                                <dd className={styles["modal__value"]}>{detail.country}</dd>
                            </dl>
                        )}

                        {genres.length > 0 && (
                            <dl className={styles["modal__row"]}>
                                <dt className={styles["modal__label"]}>
                                    {this.locale.t("common", "artist-about.genres")}
                                </dt>
                                <dd className={styles["modal__value"]}>{genres.join(" · ")}</dd>
                            </dl>
                        )}

                        <p className={styles["modal__bio"]}>
                            {detail.bio || this.locale.t("common", "artist-about.no-bio")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
