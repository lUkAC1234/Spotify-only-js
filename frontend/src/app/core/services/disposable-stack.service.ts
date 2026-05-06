import { injectable } from "@/app/shared/decorators/di";

export type DisposeFunction = () => void;
export type DisposeObject = {
    dispose: DisposeFunction;
};

const ERRORS = {
    REGISTER_WARNING: (key: string) =>
        `[REGISTER_WARNING] Side effect with "${key}" key already registered, unregistered old side effect with new one, PAY ATTENTION!`,
    REGISTER_FAILED: (key: string) => `[REGISTER_FAILED] Key "${key}" provided with invalid disposer!`,
    UNREGISTER_FAILED: "[UNREGISTER_FAILED] Side effect cleanup failed in 'unregister' method call!",
    DISPOSE_FAILED: "[DISPOSE_FAILED] Side effects cleanup failed in 'dispose' method call!",
} as const;

export interface DisposableService {
    /** Registers disposer of side effect */
    register(key: string, dispose: DisposeFunction): void;
    /** Unregisters disposer by calling its disposer and removing it from stack */
    unregister(key: string): void;
    /** Unregisters all disposers by calling all disposers registered and cleaning up stack */
    dispose(): void;
}

export interface IDisposable {
    dispose(): void;
}

@injectable({
    provideIn: "local",
})
export class DisposableService {
    #stack: Map<string, DisposeFunction> = new Map();

    register(key: string, disposeOrService: DisposeFunction | DisposeObject): void {
        let finalDispose: DisposeFunction | undefined;

        if (
            disposeOrService &&
            typeof disposeOrService === "object" &&
            "dispose" in disposeOrService &&
            typeof disposeOrService.dispose === "function"
        ) {
            finalDispose = disposeOrService.dispose.bind(disposeOrService);
        } else if (typeof disposeOrService === "function") {
            finalDispose = disposeOrService as DisposeFunction;
        }

        if (!finalDispose) {
            if (import.meta.env.DEV) {
                console.error(ERRORS.REGISTER_FAILED(key), disposeOrService);
            }
            return;
        }

        this.#stack.set(key, finalDispose);
    }

    unregister(key: string): void {
        const dispose = this.#stack.get(key);

        try {
            if (typeof dispose === "function") {
                dispose?.();
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error(ERRORS.UNREGISTER_FAILED, err);
            }
        } finally {
            this.#stack.delete(key);
        }
    }

    dispose(): void {
        for (const [key, dispose] of this.#stack) {
            try {
                dispose?.();
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.error(`[DISPOSE_FAILED] Key: ${key}`, err);
                }
            }
        }
        this.#stack.clear();
    }

    logDisposables(): void {
        console.log(Array.from(this.#stack).map(([key]) => key));
    }
}
