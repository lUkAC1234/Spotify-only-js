import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { CatalogService } from "@/app/core/services/catalog/catalog.service";
import { inject } from "@/app/shared/decorators/di";

import { EmptyState } from "./sections/empty-state/empty-state";
import { Results } from "./sections/results/results";
import styles from "./search.module.scss";
import { SearchService } from "./search.service";

@observer
export class Search extends Component {
    private title: TitleService = inject(TitleService);
    private service: SearchService = inject(SearchService);
    private catalog: CatalogService = inject(CatalogService);

    componentDidMount(): void {
        this.title.construct({ title: "Search", titleNamespace: "common", titleTKey: "nav.search" });
        this.title.init();
        this.service.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
        this.service.dispose();
    }

    render(): ReactNode {
        const hasQuery = this.catalog.lastQuery.trim().length > 0;

        return (
            <div className={styles["search"]}>
                {hasQuery ? (
                    <Results />
                ) : (
                    <EmptyState
                        genres={this.service.genres}
                        recentSearches={this.service.recentSearches}
                        onRemoveRecent={(id) => void this.service.removeRecent(id)}
                        onClearRecent={() => void this.service.clearRecent()}
                    />
                )}
            </div>
        );
    }
}
