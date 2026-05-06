import { inject, injectable } from "@/app/shared/decorators/di";

import { LocaleService } from "./locale.service";

@injectable()
export class NavLinkService {
    private localeService = inject(LocaleService);

    buildUrl(path: string): string {
        const lang = this.localeService.lang;
        const defaultLang = this.localeService.defaultLang;

        if (lang === defaultLang) {
            return path.startsWith("/") ? path : `/${path}`;
        }

        if (path.startsWith(`/${lang}`)) {
            return path;
        }

        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        return `/${lang}${cleanPath === "" ? "" : "/" + cleanPath}`;
    }
}
