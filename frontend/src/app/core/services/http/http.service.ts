import { DebouncedFunc } from "lodash";
import {
    action, computed, flow, IReactionDisposer, makeObservable, observable, reaction, runInAction
} from "mobx";

import { config } from "@/app/app.config";
import { inject, injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";
import { fetchData } from "@/app/shared/utils/functions/interceptors";
import { Log } from "@/app/shared/utils/functions/logger";
import { uniqueIdGenerator } from "@/app/shared/utils/functions/uniqueIdGenerator";

import { HttpQueue } from "./http-queue.service";

export interface HttpInit<T> extends RequestInit {
    cached?: boolean;
    cacheTTL_minutes?: number;
    errorMessage?: string;
    onLoading?: () => void;
    onSuccess?: (data?: T, response?: Response) => void;
    onError?: (err: Error, response?: Response) => void;
    /** Default response type is `json` */
    responseType?: "json" | "text" | "blob" | "arrayBuffer" | "bytes" | "clone" | "formData";
}

export type HttpConfig = {
    delay?: number;
    initialState?: HttpState;
    removeLogger?: boolean;
};

export type HttpState = "loading" | "loaded" | "error" | "idle";

const errorI18nKey: string = "error";
const CACHE_NAME: string = "http-cache-v1";
const CACHE_META_PREFIX: string = "http-cache-meta:";
const CACHE_TTL_MIN: number = config?.CACHE_TTL_MIN ?? 10;
const CACHE_TTL: number = CACHE_TTL_MIN * 60 * 1000;

const generateID = (): string => uniqueIdGenerator(15);

const hotReloadCacheHandler = async (evt: KeyboardEvent): Promise<void> => {
    let canProceed: boolean = false;

    if (evt.altKey && evt.shiftKey && evt.key == "F") {
        canProceed = true;
    }

    if (!canProceed) return;

    const cacheFound: boolean = await caches.has(CACHE_NAME);
    if (cacheFound) {
        await caches.delete(CACHE_NAME);

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.includes(CACHE_META_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    }
};

window.addEventListener("keydown", hotReloadCacheHandler, { capture: true });

@injectable({
    provideIn: "local",
})
export class Http<T> {
    private delay: number;
    private removeLogger?: boolean;
    private disposeReaction: IReactionDisposer;
    private requestId: number = 0;
    private controller: AbortController | null = null;
    private httpQueue: HttpQueue = inject(HttpQueue);
    private debouncedExecute: DebouncedFunc<(url: string | URL, init?: HttpInit<T>, reqId?: number) => void>;

    fetch: (url: string | URL, init?: HttpInit<T>) => void;

    @observable key: string = generateID();
    @observable state: HttpState = "idle";
    @observable data: T | null = null;
    @observable oldData: T | null = null;
    @observable errorMessage: string = "";

    @computed
    get loading(): boolean {
        return this.state === "loading";
    }

    @computed
    get loaded(): boolean {
        return this.state === "loaded";
    }

    @computed
    get error(): boolean {
        return this.state === "error";
    }

    @computed
    get idle(): boolean {
        return this.state === "idle";
    }

    @computed
    get isDataReady(): boolean {
        return !this.loading && !!this.data;
    }

    constructor(init?: HttpConfig) {
        this.construct(init);
    }

    /** Optional method that constructs Http module */
    construct(_init?: HttpConfig): void {
        this.delay = _init?.delay ?? 25;
        this.removeLogger = _init?.removeLogger;
        this.oldData = null;

        if (_init?.initialState) {
            this.state = _init?.initialState;
        }

        this.debouncedExecute = debounce((url, init, reqId) => this._fetch(url, init, reqId), this.delay);

        this.fetch = (url: string | URL, init?: HttpInit<T>) => {
            this.debouncedExecute.cancel();
            this.cancelFetch();
            this.requestId++;
            runInAction(() => {
                this.oldData = this.data;
            });
            const reqId = this.requestId;
            this.controller = new AbortController();
            this.debouncedExecute(url, init, reqId);
        };

        makeObservable(this);

        this.disposeReaction?.();
        this.disposeReaction = reaction(
            () => this.state,
            () => this.generateKey(),
        );
    }

    dispose(): void {
        this.disposeReaction?.();
    }

    @action.bound
    cancelFetch(): void {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }

    @action.bound
    clearData(): void {
        this.data = null;
    }

    @action.bound
    private setLoading(): void {
        this.state = "loading";
    }

    @action.bound
    private setLoaded(data?: T): void {
        this.state = "loaded";
        if (data !== undefined) this.data = data;
    }

    @action.bound
    private setError(msg: string): void {
        this.state = "error";
        this.errorMessage = msg;
    }

    @action.bound
    private setIdle(): void {
        this.state = "idle";
    }

    @action.bound
    private generateKey(): void {
        this.key = generateID();
    }

    @flow.bound
    private *_fetch(url: string | URL, init: HttpInit<T> | undefined, reqId: number) {
        let controller: AbortController;

        if (this.controller === null) {
            this.controller = new AbortController();
        }

        controller = this.controller;

        const request = new Request(url, {
            ...init,
            signal: controller!.signal,
        });
        const responseType = init?.responseType || "json";

        const requestUrl = request.url.toString();
        let response: Response;

        try {
            if (init?.cached) {
                if (request.method.toUpperCase() !== "GET") {
                    Log.MobXError(`[CACHE] caching is supported for GET requests only: ${requestUrl}`);
                } else if ("caches" in window) {
                    try {
                        const cache: Cache = yield caches.open(CACHE_NAME);
                        const cachedResp: Response | undefined = yield cache.match(request);

                        if (cachedResp) {
                            const meta: string = localStorage.getItem(CACHE_META_PREFIX + requestUrl);
                            const timestamp: number = meta ? Number(meta) : 0;
                            const cacheTTL: number = init?.cacheTTL_minutes
                                ? init.cacheTTL_minutes * 60 * 1000
                                : CACHE_TTL;
                            const ageOk: boolean = timestamp > 0 && Date.now() - timestamp <= cacheTTL;
                            const loadingKey: string = generateID();

                            try {
                                this.httpQueue.setQueue(loadingKey, {
                                    state: "loading",
                                    progress: 70,
                                });

                                if (ageOk) {
                                    try {
                                        const data = yield cachedResp[responseType]();

                                        if (reqId === this.requestId) {
                                            this.setLoaded(data);
                                            init?.onSuccess?.(data, cachedResp);
                                        }

                                        if (!this.removeLogger) {
                                            Log.API(`[CACHE GET] Served from cache: ${requestUrl}`);
                                        }

                                        return data;
                                    } catch {
                                        yield cache.delete(request);
                                        localStorage.removeItem(CACHE_META_PREFIX + requestUrl);
                                    }
                                } else {
                                    yield cache.delete(request);
                                    localStorage.removeItem(CACHE_META_PREFIX + requestUrl);
                                }
                            } finally {
                                this.httpQueue.setQueue(loadingKey, {
                                    state: "loaded",
                                    progress: 100,
                                });
                            }
                        }
                    } catch (cacheErr) {
                        if (!this.removeLogger) {
                            Log.APIError(
                                `[CACHE] Error while reading cache for ${requestUrl}: ${cacheErr?.message ?? cacheErr}`,
                            );
                        }
                    }
                }
            }
        } catch {}

        try {
            if (reqId === this.requestId) {
                this.setLoading();
                init?.onLoading?.();
            }

            response = yield fetchData(request, init);

            if (reqId !== this.requestId) return;

            if (!response.ok) {
                throw new Error(init?.errorMessage ?? errorI18nKey);
            }

            if (init?.cached && request.method.toUpperCase() === "GET" && "caches" in window) {
                try {
                    const cache = yield caches.open(CACHE_NAME);
                    yield cache.put(request, response.clone());
                    localStorage.setItem(CACHE_META_PREFIX + requestUrl, Date.now().toString());
                    if (!this.removeLogger) Log.API(`[CACHE PUT] Cached response: ${requestUrl}`);
                } catch (cacheErr) {
                    if (!this.removeLogger)
                        Log.APIError(
                            `[CACHE] Failed to write cache for ${requestUrl}: ${cacheErr?.message ?? cacheErr}`,
                        );
                }
            }

            const data = yield response[responseType]();

            if (reqId === this.requestId) {
                this.setLoaded(data);
                init?.onSuccess?.(data, response);
            }

            if (!this.removeLogger) {
                Log.API(`[${request.method}] Successful request: ${requestUrl}`);
            }

            return data;
        } catch (err) {
            if (reqId !== this.requestId) return;

            if (err.name !== "AbortError") {
                this.setError(err.message);
                if (!this.removeLogger) {
                    Log.APIError(`[${request.method}] Failed request: ${requestUrl}`);
                }
            } else {
                this.setIdle();
            }

            init?.onError?.(err, response);
        } finally {
            if (reqId === this.requestId) {
                this.controller = null;
            }
        }
    }
}
