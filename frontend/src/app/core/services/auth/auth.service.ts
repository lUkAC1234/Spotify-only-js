import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";

import { AuthCredentials, RegisterPayload, User } from "@/app/core/types/user";
import { injectable } from "@/app/shared/decorators/di";

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

    async fetchMe(): Promise<User | null> {
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
    }

    async register(payload: RegisterPayload): Promise<User | null> {
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
    }

    async logout(): Promise<void> {
        await apiRequest("POST", "/auth/logout/");
        runInAction(() => {
            this.me = null;
        });
    }

    async updateProfile(payload: UpdateProfilePayload): Promise<User | null> {
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
    }

    async uploadAvatar(file: File): Promise<User | null> {
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
    }

    async deleteAvatar(): Promise<User | null> {
        const result = await apiRequest<User>("DELETE", "/auth/me/avatar/");
        if (!result.ok || !result.data) {
            this.setError(result.error);
            return null;
        }
        runInAction(() => {
            this.me = result.data;
        });
        return result.data;
    }

    async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
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
    }
}
