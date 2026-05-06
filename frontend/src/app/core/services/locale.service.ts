import { action, computed, flow, makeObservable, observable, ObservableMap } from "mobx";

import { inject, injectable } from "@/app/shared/decorators/di";
import { getValueByPath } from "@/app/shared/utils/functions/get-value-by-path";
import { Log } from "@/app/shared/utils/functions/logger";
import { uniqueIdGenerator } from "@/app/shared/utils/functions/uniqueIdGenerator";
import loadings from "@/locale/_utils/loading.json";

import { LocaleLookup } from "../../../locale/translations";
import { HttpQueue } from "./http/http-queue.service";
import { DEFAULT_LANG, getLanguageFromPath, SUPPORTED_LANGS } from "./locale-utils";

export async function loadTranslation(namespace: string, lang: string): Promise<object> {
    try {
        const locales = import.meta.glob("../../../locale/**/*.json");
        const path = `../../../locale/${lang}/${namespace}.json`;

        if (locales[path]) {
            const module = await locales[path]();
            return (module as any).default;
        }

        throw new Error(`Locale file not found at ${path}`);
    } catch (err) {
        console.error(err);
        return {};
    }
}

export type LocaleServiceOptions = {
    enableLogger?: boolean;
};

type Lng = string;

export type LocaleNamespace = {
    name: string;
    locales: Record<Lng, object>;
};

export type Paths<T> = T extends object
    ? { [K in keyof T]: T[K] extends object ? `${K & string}.${Paths<T[K]>}` | `${K & string}` : K & string }[keyof T]
    : never;

@injectable()
export class LocaleService {
    private static readonly INTERPOLATION_REGEX: RegExp = /\{(\w+)\}/g;

    private static _options: LocaleServiceOptions = {
        enableLogger: false,
    };

    static get options(): LocaleServiceOptions {
        return LocaleService._options;
    }

    static configure(options: LocaleServiceOptions): void {
        this._options = {
            ...this._options,
            ...options,
        };
    }

    readonly langs: string[] = SUPPORTED_LANGS;
    readonly defaultLang: string = DEFAULT_LANG;

    private readonly httpQueue: HttpQueue = inject(HttpQueue);
    private readonly resultCache: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    //                                 ^lng+ns         ^path -> value

    private get options(): LocaleServiceOptions {
        return LocaleService.options;
    }

    @observable lang: string = getLanguageFromPath() || DEFAULT_LANG;
    @observable translations: ObservableMap<string, Readonly<LocaleNamespace>> = observable.map([]);

    @observable private _langLoaded: number = 0;
    @observable private loadingNamespaces = observable.set<string>();

    @computed
    get langLoaded(): number {
        return this._langLoaded;
    }

    @computed
    get isDefaultLang(): boolean {
        return this.lang === this.defaultLang;
    }

    constructor() {
        makeObservable(this);
    }

    @action.bound
    protected clearCache(namespace?: string): void {
        if (namespace) {
            this.translations.delete(namespace);
        } else {
            this.translations.clear();
            this.loadingNamespaces.clear();
        }
    }

    @action.bound
    protected reset(): void {
        this.translations.clear();
        this.loadingNamespaces.clear();
        this._langLoaded = 0;
    }

    @action.bound
    setLocale(lang: string): void {
        if (!lang || lang === this.lang) return;
        this.lang = lang;
    }

    dict<K extends keyof LocaleLookup>(namespace: K): LocaleLookup[K] {
        const namespaceData = this.translations.get(namespace as string);
        const localeData: object | undefined = namespaceData?.locales?.[this.lang];

        if (!localeData) {
            this.loadTranslation(namespace as string, this.lang);
        }

        const fallbackData: object | undefined = namespaceData?.locales?.[DEFAULT_LANG];

        return {
            ...(fallbackData ?? {}),
            ...(localeData ?? {}),
        } as LocaleLookup[K];
    }

    t<K extends keyof LocaleLookup, P extends Paths<LocaleLookup[K]>>(
        namespace: K,
        path: P & string,
        vars?: Record<string, unknown>,
    ): string {
        const namespaceData = this.translations.get(namespace as string);
        const localeData = namespaceData?.locales?.[this.lang];

        if (import.meta.env.DEV && this.options.enableLogger) {
            Log.UI(
                `[LocaleService] Translation for ${namespace}.${path}${!!vars ? " with vars" : ""}`,
                !!vars ? vars : "",
            );
        }

        if (!localeData) {
            this.loadTranslation(namespace, this.lang);
        }

        const value = this.resolvePath(localeData ?? {}, namespace, path, this.lang);

        if (typeof value !== "string") return loadings[this.lang] ?? loadings.ru ?? "...";
        return vars ? this.interpolate(value, vars) : value;
    }

    @flow.bound
    private *loadTranslation(namespace: string, lang: string) {
        const cacheKey = `${lang}:${namespace}`;

        if (this.loadingNamespaces.has(cacheKey)) return;
        if (this.translations.get(namespace)?.locales?.[lang]) return;

        this.loadingNamespaces.add(cacheKey);

        const key: string = uniqueIdGenerator(15);
        this.httpQueue.setQueue(key, {
            progress: 70,
            state: "loading",
        });

        try {
            if (import.meta.env.DEV && this.options.enableLogger) {
                Log.UI(`[LocaleService] Triggering network request for ${cacheKey}...`);
            }

            const result: any = yield loadTranslation(namespace, lang);

            const incomingData = result?.default ? result.default : result;

            const currentNamespace = this.translations.get(namespace) || {
                name: namespace,
                locales: {},
            };

            this.translations.set(namespace, {
                ...currentNamespace,
                locales: {
                    ...currentNamespace.locales,
                    [lang]: incomingData,
                },
            });

            this._langLoaded++;
        } catch (err) {
            if (import.meta.env.DEV && this.options.enableLogger) {
                console.error(`[LocaleService] Flow failed for ${cacheKey}`, err);
            }
        } finally {
            this.loadingNamespaces.delete(cacheKey);

            this.httpQueue.setQueue(key, {
                progress: 100,
                state: "loaded",
            });
        }
    }

    private resolvePath(obj: Record<string, any>, namespace: string, path: string, lang: string) {
        const cacheKey: string = `${lang}.${namespace}`;
        let nsCache: Map<string, string> | undefined = this.resultCache.get(cacheKey);

        if (!nsCache) {
            nsCache = new Map<string, string>();
            this.resultCache.set(cacheKey, nsCache);
        }

        const cached = nsCache.get(path);
        if (cached) return cached;

        const value = getValueByPath(obj, path);
        if (value != null) nsCache.set(path, value);

        return value;
    }

    private interpolate(template: string, vars: Record<string, unknown>): string {
        return template.replace(LocaleService.INTERPOLATION_REGEX, (_, key) => vars[key]?.toString() ?? `{${key}}`);
    }
}
