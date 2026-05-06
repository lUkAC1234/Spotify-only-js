/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
    readonly VITE_API_ORIGIN: string;
    readonly VITE_MODE: "development" | "production";
    readonly VITE_REACT_DEV_TOOLS: "true" | "false";
    readonly VITE_DEFAULT_LANG: "uz" | "ru" | "en";
}
