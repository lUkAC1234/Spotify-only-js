import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { ArtistDetail } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { AppDialog } from "@/app/shared/ui/app-dialog/app-dialog";
import { Avatar } from "@/app/shared/ui/avatar/avatar";

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

    render(): ReactNode {
        const { detail, isOpen, onClose } = this.props;
        const listeners = detail.monthlyListeners > 0 ? detail.monthlyListeners : detail.totalTracks * 12;
        const genres = Array.from(new Set(detail.topTracks.flatMap((t) => t.genres))).slice(0, 6);

        return (
            <AppDialog
                isOpen={isOpen}
                onClose={onClose}
                title={this.locale.t("common", "artist-about.title")}
                size="md"
            >
                <div className={styles["about"]}>
                    <header className={styles["about__hero"]}>
                        <div className={styles["about__cover"]}>
                            <Avatar name={detail.name} image={detail.image} />
                        </div>
                        <h3 className={styles["about__name"]}>{detail.name}</h3>
                        <p className={styles["about__overline"]}>
                            {this.locale.t("common", "artist.label")}
                        </p>
                    </header>

                    <dl className={styles["about__stats"]}>
                        <div className={styles["about__stat"]}>
                            <dt className={styles["about__stat-label"]}>
                                {this.locale.t("common", "artist-about.monthly-listeners")}
                            </dt>
                            <dd className={styles["about__stat-value"]}>
                                {formatListeners(listeners)}
                            </dd>
                        </div>
                        {detail.country && (
                            <div className={styles["about__stat"]}>
                                <dt className={styles["about__stat-label"]}>
                                    {this.locale.t("common", "artist-about.country")}
                                </dt>
                                <dd className={styles["about__stat-value"]}>{detail.country}</dd>
                            </div>
                        )}
                    </dl>

                    {genres.length > 0 && (
                        <section className={styles["about__section"]}>
                            <h4 className={styles["about__section-title"]}>
                                {this.locale.t("common", "artist-about.genres")}
                            </h4>
                            <ul className={styles["about__chips"]}>
                                {genres.map((genre) => (
                                    <li key={genre} className={styles["about__chip"]}>
                                        {genre}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className={styles["about__section"]}>
                        <h4 className={styles["about__section-title"]}>
                            {this.locale.t("common", "artist-about.bio-title")}
                        </h4>
                        <p className={styles["about__bio"]}>
                            {detail.bio || this.locale.t("common", "artist-about.no-bio")}
                        </p>
                    </section>
                </div>
            </AppDialog>
        );
    }
}
