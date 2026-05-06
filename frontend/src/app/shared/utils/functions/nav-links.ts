import { className } from "./className";
import { getNormalizedPath } from "./normalized-path";

function normalize(path: string): string {
    if (!path.startsWith("/")) return `/${path}`;
    return path;
}

export function isCurrentPath(pathname: string): boolean {
    const current = getNormalizedPath();
    const normalizedTarget = normalize(pathname);
    return current === normalizedTarget;
}

export function activeClassNameObserver(pathname: string, baseClassName: string, activeClassName = "active"): string {
    return className(baseClassName, {
        [activeClassName]: isCurrentPath(pathname),
    });
}
