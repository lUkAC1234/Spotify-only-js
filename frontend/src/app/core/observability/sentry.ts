import { Log } from "@/app/shared/utils/functions/logger";

interface SentryInitOptions {
    dsn: string;
    environment: string;
    release: string;
}

interface SentryGlobal {
    init?: (options: { dsn: string; environment?: string; release?: string }) => void;
    captureException?: (error: unknown) => void;
}

export const initSentry = async (): Promise<void> => {
    const env = import.meta.env;
    const dsn = (env.VITE_SENTRY_DSN as string) ?? "";
    if (!dsn) return;

    const options: SentryInitOptions = {
        dsn,
        environment: (env.VITE_SENTRY_ENVIRONMENT as string) ?? "development",
        release: (env.VITE_APP_VERSION as string) ?? "0.0.0",
    };

    const sentry = (window as unknown as { Sentry?: SentryGlobal }).Sentry;
    if (sentry?.init) {
        sentry.init(options);
        Log.App(`[sentry] initialised (env=${options.environment})`);
        return;
    }

    Log.App("[sentry] DSN provided but window.Sentry is not loaded; skipping init.");
};
