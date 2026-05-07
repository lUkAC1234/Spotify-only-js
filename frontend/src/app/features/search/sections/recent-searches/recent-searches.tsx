import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { RecentSearchEntry } from "@/app/core/services/catalog/catalog.service";
import { inject } from "@/app/shared/decorators/di";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import styles from "./recent-searches.module.scss";

interface Props {
    entries: RecentSearchEntry[];
    onRemove: (id: number) => void;
    onClear: () => void;
}

@observer
export class RecentSearches extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private navigate: NavigateService = inject(NavigateService);

    private handleSelect = (query: string): void => {
        this.navigate.navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    render(): ReactNode {
        const { entries, onRemove, onClear } = this.props;
        if (entries.length === 0) return null;

        return (
            <section className={styles["recent-searches"]}>
                <header className={styles["recent-searches__header"]}>
                    <h2 className={styles["recent-searches__title"]}>
                        {this.locale.t("common", "search.recent")}
                    </h2>
                    <button
                        type="button"
                        className={styles["recent-searches__clear"]}
                        onClick={onClear}
                    >
                        {this.locale.t("common", "search.clear-recent")}
                    </button>
                </header>
                <ul className={styles["recent-searches__list"]}>
                    {entries.map((entry) => (
                        <li key={entry.id} className={styles["recent-searches__item"]}>
                            <div className={styles["recent-searches__chip"]}>
                                <button
                                    type="button"
                                    className={styles["recent-searches__query"]}
                                    onClick={() => this.handleSelect(entry.query)}
                                >
                                    {entry.query}
                                </button>
                                <button
                                    type="button"
                                    className={styles["recent-searches__remove"]}
                                    onClick={() => onRemove(entry.id)}
                                    aria-label={this.locale.t("common", "search.remove-recent")}
                                >
                                    <SVG_CloseIcon />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        );
    }
}
