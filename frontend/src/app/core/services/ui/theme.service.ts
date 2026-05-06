import { action, makeObservable, observable, reaction } from "mobx";

import { inject, injectable } from "@/app/shared/decorators/di";
import { debounce } from "@/app/shared/utils/functions/debounce";

import { DisposableService } from "../disposable-stack.service";

export type Theme = "light" | "dark" | "system";

export const THEME_KEY: string = "theme-mode";

export const detectTheme = (): "light" | "dark" => "dark";

export const detectDefaultTheme = (): Theme => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "dark";
};

@injectable()
export class ThemeService {
    private disposable: DisposableService = inject(DisposableService);

    @observable theme: Theme = detectDefaultTheme();

    constructor() {
        makeObservable(this);
    }

    init(): void {
        this.disposable.register(
            THEME_KEY,
            reaction(
                () => this.theme,
                (theme) => {
                    this.startTransition();

                    localStorage.setItem(THEME_KEY, theme);
                    if (theme === "system") {
                        document.documentElement.removeAttribute("data-theme");
                        return;
                    }
                    document.documentElement.setAttribute("data-theme", theme);
                },
                { fireImmediately: true },
            ),
        );

        window.addEventListener("storage", this.storageListener);
    }

    dispose(): void {
        this.disposable.dispose();
        window.removeEventListener("storage", this.storageListener);
    }

    private storageListener = (evt: StorageEvent): void => {
        const { key, oldValue: oldTheme, newValue: theme } = evt;
        if (oldTheme === theme) return;

        if (theme && key === THEME_KEY) {
            this.startTransition();
            this.setTheme(theme as Theme);
        }
    };

    private startTransition(): void {
        this.setThemeTransition();
        this.removeThemeTransition();
    }

    private setThemeTransition(): void {
        document.documentElement.classList.add("theme-transition");
    }

    private removeThemeTransition = debounce(() => {
        document.documentElement.classList.remove("theme-transition");
    }, 300);

    @action.bound
    setTheme(theme: Theme): void {
        this.theme = theme;
    }

    @action.bound
    toggleTheme(): void {
        this.setTheme(this.theme === "dark" ? "light" : "dark");
    }
}
