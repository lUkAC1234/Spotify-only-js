import { reaction } from "mobx";

import { inject, injectable } from "@/app/shared/decorators/di";
import { LocaleLookup } from "@/locale/translations";

import { DisposableService } from "../disposable-stack.service";
import { LocaleService, Paths } from "../locale.service";

export type TitleServiceOptions<K extends keyof LocaleLookup = keyof LocaleLookup> = {
    title: string;
    titleNamespace?: K;
    titleTKey?: Paths<LocaleLookup[K]> & string;
};

@injectable({
    provideIn: "local",
})
export class TitleService {
    private title: string;
    private titleNamespace: keyof LocaleLookup;
    private titleTKey: string;

    private locale: LocaleService = inject(LocaleService);
    private disposable: DisposableService = inject(DisposableService);

    private updateDocumentTitle(): void {
        document.title =
            this.titleNamespace && this.titleTKey
                ? this.locale.t(this.titleNamespace, this.titleTKey as any)
                : this.title;
    }

    construct<K extends keyof LocaleLookup>(options: TitleServiceOptions<K>): void {
        this.title = options.title;
        this.titleNamespace = options.titleNamespace;
        this.titleTKey = options.titleTKey as string;
    }

    init(): void {
        this.disposable.register(
            "lang-change-load",
            reaction(
                () => ({
                    lang: this.locale.lang,
                    langLoaded: this.locale.langLoaded,
                }),
                () => this.updateDocumentTitle(),
                { fireImmediately: true },
            ),
        );
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
