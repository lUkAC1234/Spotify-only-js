import { action, makeObservable, observable, runInAction } from "mobx";

export interface ActionGuardOptions {
    cooldownMs?: number;
}

export interface ActionGuardRunOptions {
    cooldownMs?: number;
}

export const ACTION_GUARD_DEFAULT_COOLDOWN_MS = 1000;

export class ActionGuard {
    @observable inflightKeys: Set<string> = new Set();
    @observable cooldownKeys: Set<string> = new Set();

    private readonly inflight: Map<string, Promise<unknown>> = new Map();
    private readonly cooldownTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private readonly defaultCooldownMs: number;

    constructor(options: ActionGuardOptions = {}) {
        this.defaultCooldownMs = options.cooldownMs ?? ACTION_GUARD_DEFAULT_COOLDOWN_MS;
        makeObservable(this);
    }

    isBusy(key: string): boolean {
        return this.inflightKeys.has(key) || this.cooldownKeys.has(key);
    }

    isInflight(key: string): boolean {
        return this.inflightKeys.has(key);
    }

    isCoolingDown(key: string): boolean {
        return this.cooldownKeys.has(key);
    }

    async run<T>(
        key: string,
        fn: () => Promise<T>,
        options: ActionGuardRunOptions = {},
    ): Promise<T | null> {
        const existing = this.inflight.get(key);
        if (existing) return existing as Promise<T>;
        if (this.cooldownKeys.has(key)) return null;

        const promise = fn();
        this.inflight.set(key, promise);
        this.markInflight(key, true);
        try {
            return await promise;
        } finally {
            this.inflight.delete(key);
            this.markInflight(key, false);
            const cooldown = options.cooldownMs ?? this.defaultCooldownMs;
            if (cooldown > 0) {
                this.startCooldown(key, cooldown);
            }
        }
    }

    @action
    private markInflight(key: string, busy: boolean): void {
        const next = new Set(this.inflightKeys);
        if (busy) next.add(key);
        else next.delete(key);
        this.inflightKeys = next;
    }

    @action
    private startCooldown(key: string, ms: number): void {
        const next = new Set(this.cooldownKeys);
        next.add(key);
        this.cooldownKeys = next;

        const previous = this.cooldownTimers.get(key);
        if (previous) clearTimeout(previous);

        const handle = setTimeout(() => {
            runInAction(() => {
                const set = new Set(this.cooldownKeys);
                set.delete(key);
                this.cooldownKeys = set;
            });
            this.cooldownTimers.delete(key);
        }, ms);
        this.cooldownTimers.set(key, handle);
    }

    @action
    reset(key: string): void {
        this.inflight.delete(key);
        const inflightNext = new Set(this.inflightKeys);
        inflightNext.delete(key);
        this.inflightKeys = inflightNext;

        const timer = this.cooldownTimers.get(key);
        if (timer) clearTimeout(timer);
        this.cooldownTimers.delete(key);
        const cooldownNext = new Set(this.cooldownKeys);
        cooldownNext.delete(key);
        this.cooldownKeys = cooldownNext;
    }

    @action
    clear(): void {
        this.inflight.clear();
        this.inflightKeys = new Set();
        for (const timer of this.cooldownTimers.values()) clearTimeout(timer);
        this.cooldownTimers.clear();
        this.cooldownKeys = new Set();
    }
}
