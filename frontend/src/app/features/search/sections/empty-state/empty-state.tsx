import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { RecentSearchEntry } from "@/app/core/services/catalog/catalog.service";
import { Genre } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";

import { GenreTiles } from "@/app/features/home/sections/genre-tiles/genre-tiles";
import { RecentSearches } from "../recent-searches/recent-searches";
import styles from "./empty-state.module.scss";

interface Props {
    genres: Genre[];
    recentSearches: RecentSearchEntry[];
    onRemoveRecent: (id: number) => void;
    onClearRecent: () => void;
}

@observer
export class EmptyState extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);

    private handleSelectGenre = (genre: Genre): void => {
        this.navigate.navigate(`/search?q=${encodeURIComponent(genre.name)}`);
    };

    render(): ReactNode {
        const { genres, recentSearches, onRemoveRecent, onClearRecent } = this.props;

        return (
            <div className={styles["empty-state"]}>
                {recentSearches.length > 0 && (
                    <RecentSearches
                        entries={recentSearches}
                        onRemove={onRemoveRecent}
                        onClear={onClearRecent}
                    />
                )}
                {genres.length > 0 ? (
                    <GenreTiles
                        title={this.locale.t("common", "search.browse-genres")}
                        genres={genres}
                        onSelect={this.handleSelectGenre}
                    />
                ) : (
                    <p className={styles["empty-state__hint"]}>
                        {this.locale.t("common", "search.empty")}
                    </p>
                )}
            </div>
        );
    }
}
