import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthCredentials, RegisterPayload, User } from "@/app/core/types/user";
import { injectable } from "@/app/shared/decorators/di";
import { ActionGuard } from "@/app/shared/utils/classes/ActionGuard";

import { ApiError, apiRequest, ensureCsrf } from "../http/api-client";

interface UpdateProfilePayload {
    displayName?: string;
}

interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

const ME_STORAGE_KEY = "auth.me.v1";

const hydrateFromStorage = (): User | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(ME_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
};

const persistToStorage = (user: User | null): void => {
    if (typeof window === "undefined") return;
    try {
        if (user) {
            window.localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(ME_STORAGE_KEY);
        }
    } catch {
        // ignore quota / privacy-mode errors
    }
};

@injectable()
export class AuthService {
    @observable me: User | null = hydrateFromStorage();
    @observable isLoading: boolean = false;
    @observable isInitialized: boolean = false;
    @observable isBootstrapped: boolean = false;
    @observable lastError: ApiError | null = null;

    private stopPersist: (() => void) | null = null;
    private readonly guard: ActionGuard = new ActionGuard();
    private fetchMePromise: Promise<User | null> | null = null;

    constructor() {
        makeObservable(this);
    }

    @computed
    get isAuthenticated(): boolean {
        return this.me !== null;
    }

    init(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.stopPersist = reaction(
            () => this.me,
            (next) => persistToStorage(next),
        );
        void this.bootstrap();
    }

    dispose(): void {
        this.stopPersist?.();
        this.stopPersist = null;
    }

    private async bootstrap(): Promise<void> {
        await ensureCsrf();
        await this.fetchMe();
        runInAction(() => {
            this.isBootstrapped = true;
        });
    }

    @action.bound
    setMe(user: User | null): void {
        this.me = user;
    }

    @action.bound
    setLoading(value: boolean): void {
        this.isLoading = value;
    }

    @action.bound
    setError(error: ApiError | null): void {
        this.lastError = error;
    }

    @action.bound
    applyMePatch(patch: Partial<User>): void {
        if (!this.me) return;
        this.me = { ...this.me, ...patch };
    }

    async fetchMe(): Promise<User | null> {
        if (this.fetchMePromise) return this.fetchMePromise;
        this.fetchMePromise = this.fetchMeInternal();
        try {
            return await this.fetchMePromise;
        } finally {
            this.fetchMePromise = null;
        }
    }

    private async fetchMeInternal(): Promise<User | null> {
        const result = await apiRequest<User>("GET", "/auth/me/");
        if (result.ok && result.data) {
            runInAction(() => {
                this.me = result.data;
            });
            return result.data;
        }
        if (result.status === 401) {
            runInAction(() => {
                this.me = null;
            });
        }
        return null;
    }

    async login(credentials: AuthCredentials): Promise<User | null> {
        return (
            (await this.guard.run("auth:login", async () => {
                this.setLoading(true);
                this.setError(null);
                await ensureCsrf();
                const result = await apiRequest<User>("POST", "/auth/login/", {
                    body: { identifier: credentials.identifier, password: credentials.password },
                });
                runInAction(() => {
                    this.isLoading = false;
                });
                if (!result.ok || !result.data) {
                    this.setError(result.error);
                    return null;
                }
                runInAction(() => {
                    this.me = result.data;
                });
                return result.data;
            })) ?? null
        );
    }

    async register(payload: RegisterPayload): Promise<User | null> {
        return (
            (await this.guard.run("auth:register", async () => {
                this.setLoading(true);
                this.setError(null);
                await ensureCsrf();
                const result = await apiRequest<User>("POST", "/auth/register/", {
                    body: {
                        email: payload.email,
                        username: payload.username,
                        password: payload.password,
                        displayName: payload.displayName,
                    },
                });
                runInAction(() => {
                    this.isLoading = false;
                });
                if (!result.ok || !result.data) {
                    this.setError(result.error);
                    return null;
                }
                runInAction(() => {
                    this.me = result.data;
                });
                return result.data;
            })) ?? null
        );
    }

    async logout(): Promise<void> {
        await this.guard.run("auth:logout", async () => {
            await apiRequest("POST", "/auth/logout/");
            runInAction(() => {
                this.me = null;
            });
        });
    }

    async updateProfile(payload: UpdateProfilePayload): Promise<User | null> {
        return (
            (await this.guard.run("auth:update-profile", async () => {
                this.setLoading(true);
                this.setError(null);
                const result = await apiRequest<User>("PATCH", "/auth/me/", { body: payload });
                runInAction(() => {
                    this.isLoading = false;
                });
                if (!result.ok || !result.data) {
                    this.setError(result.error);
                    return null;
                }
                runInAction(() => {
                    this.me = result.data;
                });
                return result.data;
            })) ?? null
        );
    }

    async uploadAvatar(file: File): Promise<User | null> {
        return (
            (await this.guard.run("auth:upload-avatar", async () => {
                this.setLoading(true);
                this.setError(null);
                const formData = new FormData();
                formData.append("avatar", file);
                const result = await apiRequest<User>("POST", "/auth/me/avatar/", { body: formData });
                runInAction(() => {
                    this.isLoading = false;
                });
                if (!result.ok || !result.data) {
                    this.setError(result.error);
                    return null;
                }
                runInAction(() => {
                    this.me = result.data;
                });
                return result.data;
            })) ?? null
        );
    }

    async deleteAvatar(): Promise<User | null> {
        return (
            (await this.guard.run("auth:delete-avatar", async () => {
                const result = await apiRequest<User>("DELETE", "/auth/me/avatar/");
                if (!result.ok || !result.data) {
                    this.setError(result.error);
                    return null;
                }
                runInAction(() => {
                    this.me = result.data;
                });
                return result.data;
            })) ?? null
        );
    }

    async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
        const outcome = await this.guard.run("auth:change-password", async () => {
            this.setLoading(true);
            this.setError(null);
            const result = await apiRequest("POST", "/auth/me/password/", { body: payload });
            runInAction(() => {
                this.isLoading = false;
            });
            if (!result.ok) {
                this.setError(result.error);
                return false;
            }
            return true;
        });
        return outcome ?? false;
    }
}
