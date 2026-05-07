import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { Album } from "@/app/core/types/album";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./discography.module.scss";

type FilterKey = "all" | "albums" | "singles" | "compilations";

interface Props {
    albums: Album[];
}

interface State {
    filter: FilterKey;
}

const FILTERS = [
    { key: "all" as FilterKey, labelKey: "artist.discography-all" },
    { key: "albums" as FilterKey, labelKey: "artist.discography-albums" },
    { key: "singles" as FilterKey, labelKey: "artist.discography-singles" },
    { key: "compilations" as FilterKey, labelKey: "artist.discography-compilations" },
] as const;

const matchesFilter = (album: Album, filter: FilterKey): boolean => {
    if (filter === "all") return true;
    if (filter === "albums") return album.type === "album";
    if (filter === "singles") return album.type === "single" || album.type === "ep";
    if (filter === "compilations") return album.type === "compilation";
    return true;
};

@observer
export class Discography extends Component<Props, State> {
    private locale: LocaleService = inject(LocaleService);

    state: State = { filter: "all" };

    private setFilter = (filter: FilterKey): void => {
        this.setState({ filter });
    };

    render(): ReactNode {
        const { albums } = this.props;
        if (albums.length === 0) return null;
        const visible = albums.filter((album) => matchesFilter(album, this.state.filter));

        return (
            <section className={styles["discography"]}>
                <header className={styles["discography__header"]}>
                    <h2 className={styles["discography__title"]}>
                        {this.locale.t("common", "artist.discography")}
                    </h2>
                    <nav
                        className={styles["discography__filters"]}
                        aria-label={this.locale.t("common", "artist.discography-filters")}
                    >
                        {FILTERS.map(({ key, labelKey }) => (
                            <button
                                key={key}
                                type="button"
                                className={className(styles["discography__filter"], {
                                    [styles["discography__filter--active"]]: this.state.filter === key,
                                })}
                                onClick={() => this.setFilter(key)}
                            >
                                {this.locale.t("common", labelKey)}
                            </button>
                        ))}
                    </nav>
                </header>

                {visible.length === 0 ? (
                    <p className={styles["discography__empty"]}>
                        {this.locale.t("common", "artist.discography-empty")}
                    </p>
                ) : (
                    <ul className={styles["discography__grid"]}>
                        {visible.map((album) => (
                            <li key={album.id} className={styles["discography__card"]}>
                                <NavLink
                                    to={`/album/${album.id}`}
                                    baseClass={styles["discography__link"]}
                                >
                                    <div className={styles["discography__cover"]}>
                                        {album.cover && <img src={album.cover} alt="" loading="lazy" />}
                                    </div>
                                    <span className={styles["discography__name"]} title={album.title}>
                                        {album.title}
                                    </span>
                                    <span className={styles["discography__meta"]}>
                                        {album.releaseDate
                                            ? `${album.releaseDate.slice(0, 4)} • ${this.locale.t("common", `artist.type-${album.type}`)}`
                                            : this.locale.t("common", `artist.type-${album.type}`)}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        );
    }
}
