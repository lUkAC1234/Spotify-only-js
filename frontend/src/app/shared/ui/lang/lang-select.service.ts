import { action, computed, makeObservable, observable } from "mobx";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject, injectable } from "@/app/shared/decorators/di";
import { langs } from "@/locale/_utils/langs.json";

@injectable({
    provideIn: "local",
})
export class LangSelectService {
    locale: LocaleService = inject(LocaleService);

    @observable isOpen: boolean = false;

    @computed
    get selectedLang(): string {
        return langs.find(({ id }) => id === this.locale.lang)?.children || "Select";
    }

    constructor() {
        makeObservable(this);
    }

    @action.bound
    toggleDropdown(): void {
        this.isOpen = !this.isOpen;
    }
}
