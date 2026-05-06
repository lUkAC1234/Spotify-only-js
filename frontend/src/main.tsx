import "@/assets/styles/style.scss";

import { AppRouter } from "./app/core/providers/router";
import { FocusPlugin } from "./app/shared/utils/classes/FocusPlugin";
import { HistoryPlugin } from "./app/shared/utils/classes/HistoryModule";
import { bootstrap } from "./app/shared/utils/classes/ReactApp";
import { Log } from "./app/shared/utils/functions/logger";

type Mode = "production" | "development";

const env = import.meta.env;
const MODE: Mode = env.VITE_MODE as Mode;
const root: HTMLElement | null = document.getElementById("app");

if (MODE === "development") {
    Log.App("Application runs in development mode...");
    Log.App("StrictMode is turned on! React renders twice");
}

bootstrap()
    .node(root)
    .use(HistoryPlugin)
    .use(FocusPlugin)
    .boot()
    .render(<AppRouter />, MODE === "development");
