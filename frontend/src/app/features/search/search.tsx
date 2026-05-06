import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { inject } from "@/app/shared/decorators/di";

import { Results } from "./sections/results/results";
import styles from "./search.module.scss";
import { SearchService } from "./search.service";

@observer
export class Search extends Component {
    private title: TitleService = inject(TitleService);
    private service: SearchService = inject(SearchService);

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
        return (
            <div className={styles["search"]}>
                <Results />
            </div>
        );
    }
}
