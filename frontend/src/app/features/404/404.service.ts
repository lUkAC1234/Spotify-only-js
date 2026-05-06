import { reaction } from "mobx";

import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { ScrollService } from "@/app/core/services/scroll.service";
import { LayoutService } from "@/app/core/services/ui/layout.service";
import { inject, injectable } from "@/app/shared/decorators/di";

@injectable()
export class Error404Service {
    private readonly locale: LocaleService = inject(LocaleService);
    private readonly scroll: ScrollService = inject(ScrollService);
    private readonly layout: LayoutService = inject(LayoutService);
    private readonly disposable: DisposableService = inject(DisposableService);

    init(): void {
        this.scroll.scrollToTop(this.layout.mainRef.current);
        this.disposable.register(
            "title-reaction",
            reaction(
                () => ({
                    lang: this.locale.lang,
                    langLoaded: this.locale.langLoaded,
                }),
                () => {
                    const title: string = this.locale.t("error404", "page-title");
                    if (title && !title.includes("...")) {
                        document.title = title;
                    }
                },
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
