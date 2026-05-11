import { Component, ComponentType, ReactNode } from "react";

import { Genre } from "@/app/core/types/playlist";
import { className } from "@/app/shared/utils/functions/className";
import { SVG_EqualizerIllustration } from "@/app/shared/ui/svg/illustrations/svg-equalizer-illustration";
import { SVG_GuitarIllustration } from "@/app/shared/ui/svg/illustrations/svg-guitar-illustration";
import { SVG_HeadphonesIllustration } from "@/app/shared/ui/svg/illustrations/svg-headphones-illustration";
import { SVG_MicrophoneIllustration } from "@/app/shared/ui/svg/illustrations/svg-microphone-illustration";
import { SVG_VinylIllustration } from "@/app/shared/ui/svg/illustrations/svg-vinyl-illustration";
import { SVG_WavesIllustration } from "@/app/shared/ui/svg/illustrations/svg-waves-illustration";

import styles from "./genre-tiles.module.scss";

interface Props {
    title: string;
    genres: Genre[];
    onSelect?: (genre: Genre) => void;
}

const ILLUSTRATIONS: ComponentType<{ className?: string }>[] = [
    SVG_VinylIllustration,
    SVG_HeadphonesIllustration,
    SVG_EqualizerIllustration,
    SVG_MicrophoneIllustration,
    SVG_GuitarIllustration,
    SVG_WavesIllustration,
];

const VARIANT_COUNT = 6;

const hashSlug = (slug: string): number => {
    let hash = 0;
    for (let i = 0; i < slug.length; i += 1) {
        hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
    }
    return hash;
};

export class GenreTiles extends Component<Props> {
    render(): ReactNode {
        const { title, genres, onSelect } = this.props;
        if (genres.length === 0) return null;

        return (
            <section className={styles["genre-tiles"]}>
                <header className={styles["genre-tiles__header"]}>
                    <h2 className={styles["genre-tiles__title"]}>{title}</h2>
                </header>
                <ul className={styles["genre-tiles__grid"]}>
                    {genres.map((genre) => {
                        const seed = hashSlug(genre.slug);
                        const variant = seed % VARIANT_COUNT;
                        const Illustration = ILLUSTRATIONS[seed % ILLUSTRATIONS.length];
                        return (
                            <li
                                key={genre.slug}
                                className={className(styles["genre-tiles__tile"], {
                                    [styles[`genre-tiles__tile--v${variant}`]]: true,
                                })}
                            >
                                <button
                                    type="button"
                                    className={styles["genre-tiles__btn"]}
                                    onClick={onSelect ? () => onSelect(genre) : undefined}
                                >
                                    <span className={styles["genre-tiles__name"]}>{genre.name}</span>
                                    <span className={styles["genre-tiles__art"]} aria-hidden="true">
                                        <Illustration className={styles["genre-tiles__art-svg"]} />
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>
        );
    }
}
