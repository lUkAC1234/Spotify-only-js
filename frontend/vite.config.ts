import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";

const env = loadEnv(process.env.VITE_MODE || "development", process.cwd(), "VITE_");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "src");

class MissingEnvError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MissingEnvError";
    }
}

function requireEnv(name: string) {
    const value = env[name];
    if (!value) {
        const error = new MissingEnvError(`Missing required environment variable: ${name}`);
        throw error;
    }

    return value;
}

export function convertToWebP() {
    let outDir: string;

    async function processDir(dir: string) {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await processDir(fullPath);
            } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
                const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, ".webp");
                await sharp(fullPath).webp({ quality: 75 }).toFile(webpPath);
            }
        }
    }

    return {
        name: "convert-to-webp",

        configResolved(config: any) {
            outDir = config.build.outDir;
        },

        async closeBundle() {
            const buildDir = path.resolve(process.cwd(), outDir);
            await processDir(buildDir);
        },
    };
}

function checkEnvVars(vars: string[]): void {
    for (const envVarName of vars) requireEnv(envVarName);
    if (env.MODE === "production") return;
    console.table(env);
}

const requiredEnvVars = ["VITE_MODE", "VITE_REACT_DEV_TOOLS", "VITE_DEFAULT_LANG", "VITE_API_ORIGIN"];

checkEnvVars(requiredEnvVars);

export default defineConfig({
    appType: "spa",
    mode: env.VITE_MODE,
    plugins: [
        react({
            tsDecorators: true,
        }),
        convertToWebP(),
        ViteImageOptimizer({
            png: { quality: 70 },
            jpg: { quality: 70 },
        }),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            includeAssets: ["favicon.svg", "robots.txt"],
            manifest: {
                name: "Spenzora",
                short_name: "Spenzora",
                description: "Spenzora — music streaming on top of Jamendo + Audius.",
                theme_color: "#121212",
                background_color: "#000000",
                display: "standalone",
                orientation: "portrait",
                start_url: "/",
                scope: "/",
                icons: [
                    {
                        src: "favicon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                navigateFallback: "/index.html",
                navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/media\//],
                runtimeCaching: [
                    {
                        urlPattern: /\/api\/v1\/stream\//,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /\/api\/v1\/auth\/me/,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /\/api\/v1\/me\//,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /\/api\/v1\//,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "spotify-api",
                            networkTimeoutSeconds: 4,
                            expiration: { maxEntries: 80, maxAgeSeconds: 60 * 30 },
                        },
                    },
                    {
                        urlPattern: ({ url }) =>
                            url.hostname.includes("usercontent.jamendo.com") ||
                            url.hostname.includes("audius.co") ||
                            url.hostname.includes("avatars.yandex.net") ||
                            url.hostname.includes("avatars.mds.yandex.net"),
                        handler: "CacheFirst",
                        options: {
                            cacheName: "spotify-covers",
                            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
                navigateFallback: "index.html",
                suppressWarnings: true,
                type: "module",
            },
        }),
    ],
    resolve: {
        alias: {
            "@": root,
        },
    },
    preview: {
        port: 5174,
    },
    build: {
        target: "esnext",
        minify: "esbuild",
        rollupOptions: {
            output: {
                entryFileNames: "js/[name].[hash].js",
                chunkFileNames: "js/[name].[hash].js",
                assetFileNames: "assets/[hash].[ext]",
            },
        },
    },
    server: {
        port: 5173,
        strictPort: false,
        open: true,
        proxy: {
            "/api": {
                target: env.VITE_API_ORIGIN || "http://127.0.0.1:8000",
                changeOrigin: true,
                cookieDomainRewrite: "",
                xfwd: true,
            },
            "/media": {
                target: env.VITE_API_ORIGIN || "http://127.0.0.1:8000",
                changeOrigin: true,
            },
        },
    },
});
