import { LocaleService } from "@/app/core/services/locale.service";
import { SUPPORTED_LANGS } from "@/app/core/services/locale-utils";
import { inject } from "@/app/shared/decorators/di";

export function getNormalizedPath(): string {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const locale: LocaleService = inject(LocaleService);

    if (parts.length > 0 && SUPPORTED_LANGS.includes(parts[0])) {
        const lang = parts.shift()!;
        if (lang !== locale.defaultLang) {
            return "/" + parts.join("/");
        }
        return "/" + parts.join("/");
    }

    return "/" + parts.join("/");
}
