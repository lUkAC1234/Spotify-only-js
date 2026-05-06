import { lazy as lazyReact } from "react";

import { HttpQueue } from "@/app/core/services/http/http-queue.service";

import { inject } from "../../decorators/di";
import { uniqueIdGenerator } from "./uniqueIdGenerator";

const updateHttpQueue = (key: string, httpQueue: HttpQueue, state: "loaded" | "loading") => {
    httpQueue.setQueue(key, {
        progress: state === "loaded" ? 100 : 65,
        state,
    });
};

export namespace Lazy {
    const httpQueue: HttpQueue = inject(HttpQueue);

    export function Named<T extends keyof any>(importer: () => Promise<any>, name: T) {
        return lazyReact(async () => {
            const key: string = uniqueIdGenerator(15);
            updateHttpQueue(key, httpQueue, "loading");

            try {
                const module = await importer();
                return { default: module[name] };
            } finally {
                updateHttpQueue(key, httpQueue, "loaded");
            }
        });
    }

    export function Default(importer: () => Promise<any>) {
        return lazyReact(async () => {
            const key: string = uniqueIdGenerator(15);
            updateHttpQueue(key, httpQueue, "loading");

            try {
                const module = await importer();
                return { default: module };
            } finally {
                updateHttpQueue(key, httpQueue, "loaded");
            }
        });
    }
}
