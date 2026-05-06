import { createElement, ReactNode, StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import { disableReactDevTools } from "@/app/shared/utils/functions/disableReactDevTools";

import { ReactAppPlugin } from "./ReactPlugin";

const env = import.meta.env;

class ReactApp {
    private plugins: Map<ReactAppPlugin<any>, object> = new Map();
    private appNode: HTMLElement;
    private template: ReactNode;
    private root: Root;

    private checkReactDevTools(): void {
        const allowReactDevTools: "true" | "false" = env.VITE_REACT_DEV_TOOLS;
        if (allowReactDevTools === "false") {
            disableReactDevTools();
        }
    }

    private initPlugins(): void {
        for (const [pluginInstance, options] of this.plugins) {
            pluginInstance.setup(options!);
        }
    }

    node(appNode: HTMLElement): ReactApp {
        this.appNode = appNode;
        return this;
    }

    use<T extends object>(PluginClass: new () => ReactAppPlugin<any>, options?: T): ReactApp {
        this.plugins.set(new PluginClass(), options!);
        return this;
    }

    render(template: ReactNode, strictMode?: boolean): void {
        this.initPlugins();
        this.template = strictMode ? createElement(StrictMode, {}, template) : template;
        this.root.render(this.template);
    }

    boot(): ReactApp {
        if (!this.appNode) {
            throw new Error("App node is undefined or you didn't set it!");
        }
        this.root = createRoot(this.appNode);
        this.checkReactDevTools();

        return this;
    }
}

export function bootstrap() {
    const app = new ReactApp();
    return app;
}
