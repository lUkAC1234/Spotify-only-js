import fs from "fs";
import path from "path";
import { loadEnv } from "vite";

const env = loadEnv(process.env.VITE_MODE || "development", process.cwd(), "VITE_");

const languages = {
    en: {
        lang: "en",
        locale: "en_US",
        title: "Spotify",
        description: "Spotify",
    },
    ru: {
        lang: "ru",
        locale: "ru_RU",
        title: "Spotify",
        description: "Spotify",
    },
    uz: {
        lang: "uz",
        locale: "uz_UZ",
        title: "Spotify",
        description: "Spotify",
    },
};

const buildDir = "dist";
const originalHtmlPath = path.join(buildDir, "index.html");
const siteBaseUrl = "";

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

try {
    if (!fs.existsSync(originalHtmlPath)) throw new Error(`Original index.html not found at ${originalHtmlPath}`);
    let html = fs.readFileSync(originalHtmlPath, "utf8");

    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
    html = html.replace(/<link\s+rel=["']alternate["'][^>]*>\s*/gi, "");
    html = html.replace(
        /<meta[^>]*(name|property)=["'](description|keywords|twitter:[^'"]+|og:[^'"]+)["'][^>]*>\s*/gi,
        "",
    );

    html = html.replace(/<html\s+lang=['"][^'"]*['"]>/i, '<html lang="__LANG__">');
    html = html.replace(/<title>[^<]*<\/title>/i, "<title>__TITLE__</title>");
    if (!/__SEO_TAGS__/.test(html)) html = html.replace(/<\/head>/i, "__SEO_TAGS__\n</head>");

    const seoFolder = path.join(buildDir, "seo");
    fs.mkdirSync(seoFolder, { recursive: true });

    for (const [langCode, data] of Object.entries(languages)) {
        let siteUrl = `${siteBaseUrl}/`;
        if (langCode !== env.VITE_DEFAULT_LANG) {
            siteUrl += `${langCode}/`;
        }

        const seoTags = `
<meta name="description" content="${escapeHtml(data.description)}">
<meta property="og:title" content="${escapeHtml(data.title)}">
<meta property="og:description" content="${escapeHtml(data.description)}">
<meta property="og:url" content="${siteUrl}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${data.locale}">
`;

        const content = html
            .replace(/__LANG__/g, data.lang)
            .replace(/__TITLE__/g, data.title)
            .replace("__SEO_TAGS__", seoTags);

        const outputPath = path.join(seoFolder, `${langCode}.html`);
        fs.writeFileSync(outputPath, content, "utf8");
        console.log(`Generated: ${path.relative(process.cwd(), outputPath)}`);
    }

    console.log(`\nSEO HTML files generated in /${buildDir}/seo`);
} catch (err) {
    console.error("SEO generation failed:", err);
}
