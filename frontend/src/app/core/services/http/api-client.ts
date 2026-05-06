import { config } from "@/app/app.config";
import { Log } from "@/app/shared/utils/functions/logger";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_COOKIE_NAME = "csrftoken";

export interface ApiError {
    code: string;
    message: string;
    status: number;
    details?: unknown;
}

export interface ApiRequestInit extends Omit<RequestInit, "body"> {
    body?: BodyInit | object | null;
    params?: Record<string, string | number | undefined>;
}

export interface ApiResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    error: ApiError | null;
    response: Response;
}

const apiOrigin = (): string => {
    if (import.meta.env.DEV) return "";
    return import.meta.env.VITE_API_ORIGIN ?? "";
};

const readCsrfCookie = (): string | null => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const entry of cookies) {
        const [name, value] = entry.split("=");
        if (name === CSRF_COOKIE_NAME) return decodeURIComponent(value);
    }
    return null;
};

const buildUrl = (path: string, params?: ApiRequestInit["params"]): string => {
    const base = apiOrigin();
    const prefix = config.API_PREFIX;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const fullPath = `${prefix}${normalized}`;
    const baseHref = base || (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const url = new URL(fullPath, baseHref);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, String(value));
            }
        }
    }
    return base ? url.toString() : `${url.pathname}${url.search}`;
};

const isFormData = (value: unknown): value is FormData => typeof FormData !== "undefined" && value instanceof FormData;
const isBlob = (value: unknown): value is Blob => typeof Blob !== "undefined" && value instanceof Blob;
const isReadableStream = (value: unknown): boolean =>
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream;
const isUrlEncoded = (value: unknown): value is URLSearchParams =>
    typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;

const prepareBody = (
    method: string,
    body: ApiRequestInit["body"],
    headers: Headers,
): BodyInit | null | undefined => {
    if (body === undefined || body === null) return undefined;
    if (!UNSAFE_METHODS.has(method)) return undefined;
    if (isFormData(body) || isBlob(body) || isReadableStream(body) || isUrlEncoded(body) || typeof body === "string") {
        return body as BodyInit;
    }
    headers.set("Content-Type", "application/json");
    return JSON.stringify(body);
};

const parseResponse = async <T>(response: Response): Promise<{ data: T | null; error: ApiError | null }> => {
    if (response.status === 204 || response.status === 205) {
        return { data: null, error: null };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let payload: unknown = null;
    if (contentType.includes("application/json")) {
        try {
            payload = await response.json();
        } catch (err) {
            Log.APIError(`[api] failed to parse JSON: ${(err as Error).message}`);
        }
    } else {
        payload = await response.text().catch(() => null);
    }

    if (!response.ok) {
        const fallback: ApiError = {
            code: "request_failed",
            message: response.statusText || "Request failed",
            status: response.status,
        };
        if (payload && typeof payload === "object") {
            const obj = payload as Record<string, unknown>;
            return {
                data: null,
                error: {
                    code: typeof obj.code === "string" ? obj.code : fallback.code,
                    message: typeof obj.message === "string" ? obj.message : fallback.message,
                    status: response.status,
                    details: obj.details,
                },
            };
        }
        return { data: null, error: fallback };
    }

    return { data: (payload as T) ?? null, error: null };
};

export const ensureCsrf = async (): Promise<void> => {
    if (readCsrfCookie()) return;
    try {
        await fetch(buildUrl("/auth/csrf/"), { credentials: "include" });
    } catch (err) {
        Log.APIError(`[api] csrf bootstrap failed: ${(err as Error).message}`);
    }
};

export const apiRequest = async <T>(method: string, path: string, init: ApiRequestInit = {}): Promise<ApiResult<T>> => {
    const upper = method.toUpperCase();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    const body = prepareBody(upper, init.body, headers);

    if (UNSAFE_METHODS.has(upper)) {
        const csrf = readCsrfCookie();
        if (csrf) headers.set("X-CSRFToken", csrf);
    }

    let response: Response;
    try {
        response = await fetch(buildUrl(path, init.params), {
            method: upper,
            credentials: "include",
            mode: "cors",
            ...init,
            headers,
            body,
        });
    } catch (err) {
        const error: ApiError = {
            code: "network_error",
            message: (err as Error).message || "Network error",
            status: 0,
        };
        Log.APIError(`[api ${upper}] ${path} -> ${error.message}`);
        return {
            ok: false,
            status: 0,
            data: null,
            error,
            response: new Response(null, { status: 0 }),
        };
    }

    const parsed = await parseResponse<T>(response);
    return {
        ok: response.ok,
        status: response.status,
        data: parsed.data,
        error: parsed.error,
        response,
    };
};

export const apiUrl = (path: string, params?: ApiRequestInit["params"]): string => buildUrl(path, params);
