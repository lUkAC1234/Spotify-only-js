export const LEGAL_LINKS = [
    { tKey: "sidebar.footer.legal", to: "/legal" },
    { tKey: "sidebar.footer.safety", to: "/safety" },
    { tKey: "sidebar.footer.privacy", to: "/privacy" },
    { tKey: "sidebar.footer.cookies", to: "/cookies" },
    { tKey: "sidebar.footer.ads", to: "/ads" },
    { tKey: "sidebar.footer.accessibility", to: "/accessibility" },
] as const;

export type LegalLinkTKey = (typeof LEGAL_LINKS)[number]["tKey"];
