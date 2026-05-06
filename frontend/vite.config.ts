import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// import { VitePWA } from "vite-plugin-pwa";
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
        // VitePWA({
        //     registerType: "autoUpdate",
        //     injectRegister: false,

        //     pwaAssets: {
        //         disabled: false,
        //         config: true,
        //     },

        //     manifest: {
        //         name: "my-pwa-app",
        //         short_name: "my-pwa-app",
        //         description: "my-pwa-app",
        //         theme_color: "#ffffff",
        //     },

        //     workbox: {
        //         globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        //         cleanupOutdatedCaches: true,
        //         clientsClaim: true,
        //     },

        //     devOptions: {
        //         enabled: false,
        //         navigateFallback: "index.html",
        //         suppressWarnings: true,
        //         type: "module",
        //     },
        // }),
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
