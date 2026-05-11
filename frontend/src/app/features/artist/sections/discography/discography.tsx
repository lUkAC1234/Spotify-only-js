import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { LocationService } from "@/app/core/services/location.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { Album } from "@/app/core/types/album";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { NavLink } from "@/app/shared/ui/link/nav-link";

import styles from "./discography.module.scss";

type FilterKey = "all" | "albums" | "singles" | "compilations";

interface Props {
    albums: Album[];
}

const FILTERS = [
    { key: "all" as FilterKey, labelKey: "artist.discography-all" },
    { key: "albums" as FilterKey, labelKey: "artist.discography-albums" },
    { key: "singles" as FilterKey, labelKey: "artist.discography-singles" },
    { key: "compilations" as FilterKey, labelKey: "artist.discography-compilations" },
] as const;

const VALID_FILTERS: readonly FilterKey[] = ["all", "albums", "singles", "compilations"];
const DEFAULT_FILTER: FilterKey = "all";
const TAB_PARAM = "tab";

const isFilterKey = (value: string | null): value is FilterKey =>
    value !== null && (VALID_FILTERS as readonly string[]).includes(value);

const matchesFilter = (album: Album, filter: FilterKey): boolean => {
    if (filter === "all") return true;
    if (filter === "albums") return album.type === "album";
    if (filter === "singles") return album.type === "single" || album.type === "ep";
    if (filter === "compilations") return album.type === "compilation";
    return true;
};

@observer
export class Discography extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private location: LocationService = inject(LocationService);
    private navigate: NavigateService = inject(NavigateService);

    private get currentFilter(): FilterKey {
        const params = new URLSearchParams(this.location.location.search);
        const value = params.get(TAB_PARAM);
        return isFilterKey(value) ? value : DEFAULT_FILTER;
    }

    private setFilter = (filter: FilterKey): void => {
        if (this.currentFilter === filter) return;
        const current = this.location.location;
        const params = new URLSearchParams(current.search);
        if (filter === DEFAULT_FILTER) {
            params.delete(TAB_PARAM);
        } else {
            params.set(TAB_PARAM, filter);
        }
        const query = params.toString();
        const target = query ? `${current.pathname}?${query}` : current.pathname;
        this.navigate.navigate(target, { replace: true });
    };

    render(): ReactNode {
        const { albums } = this.props;
        if (albums.length === 0) return null;
        const filter = this.currentFilter;
        const visible = albums.filter((album) => matchesFilter(album, filter));

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
                                    [styles["discography__filter--active"]]: filter === key,
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
