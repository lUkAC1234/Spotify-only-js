import { HttpQueue } from "@/app/core/services/http/http-queue.service";
import { inject } from "@/app/shared/decorators/di";

import { uniqueIdGenerator } from "./uniqueIdGenerator";

declare global {
    interface Window {
        fetchData(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    }
}

export let fetchData = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
        const response = await fetch(input, init);
        return response;
    } catch (e) {
        throw e;
    }
};

export type Middleware = [
    (input: RequestInfo | URL, init?: RequestInit) => Promise<void>,
    (response: Response) => Promise<any>,
];

window.fetchData = fetchData;

export function setupInterceptors(middlewares?: Middleware[]): void {
    const originalFetch = fetchData;
    const httpQueue: HttpQueue = inject(HttpQueue);

    fetchData = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const key: string = uniqueIdGenerator(10);
        httpQueue.setQueue(key, { state: "loading", progress: 70 });

        try {
            const requestConfig: RequestInit = {
                ...init,
            };

            for (const [req, _res] of middlewares || []) {
                try {
                    await req?.(input, requestConfig);
                } catch (err) {
                    console.error("Request middleware failed: ", err);
                }
            }

            const response: Response = await originalFetch(input, requestConfig);

            for (const [_res, res] of middlewares || []) {
                try {
                    await res?.(response.clone());
                } catch (err) {
                    console.error("Response middleware failed: ", err);
                }
            }

            return response;
        } catch (e) {
            throw e;
        } finally {
            httpQueue.setQueue(key, { state: "loaded", progress: 100 });
        }
    };
}
