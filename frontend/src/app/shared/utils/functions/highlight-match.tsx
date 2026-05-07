import { ReactNode } from "react";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const highlightMatch = (text: string, query: string): ReactNode => {
    const trimmed = (query || "").trim();
    if (!text || !trimmed) return text;
    const pattern = new RegExp(`(${escapeRegExp(trimmed)})`, "i");
    const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "ig"));
    if (parts.length <= 1) return text;
    return parts.map((part, index) =>
        pattern.test(part) && part.toLowerCase() === trimmed.toLowerCase() ? (
            <mark key={index}>{part}</mark>
        ) : (
            <span key={index}>{part}</span>
        ),
    );
};
