import { Component, ReactNode } from "react";

import { Genre } from "@/app/core/types/playlist";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./genre-tiles.module.scss";

interface Props {
    title: string;
    genres: Genre[];
    onSelect?: (genre: Genre) => void;
}

const HUE_VARIANTS = 6;

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
                    {genres.map((genre, index) => {
                        const variant = (genre.slug.length + index) % HUE_VARIANTS;
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
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>
        );
    }
}
