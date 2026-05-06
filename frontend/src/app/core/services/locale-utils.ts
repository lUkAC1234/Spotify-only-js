const env: ImportMetaEnv = import.meta.env;
export const DEFAULT_LANG: string = env.VITE_DEFAULT_LANG;
export const SUPPORTED_LANGS: string[] = ["ru", "en", "uz"];

export const indexOfLangPath = (): number => {
    const splittedPathList: string[] = location.pathname.split("/");
    return splittedPathList.findIndex((lng) => SUPPORTED_LANGS.includes(lng));
};

export const getLanguageFromPath = (): string | null => {
    const parts: string[] = location.pathname.split("/");
    const index: number = indexOfLangPath();

    if (index !== -1) {
        return parts[index];
    }

    return DEFAULT_LANG;
};
