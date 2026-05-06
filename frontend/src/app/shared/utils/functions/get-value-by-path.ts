type Accessor = (obj: any) => any;

const cache: Map<string, Accessor> = new Map<string, Accessor>();
const MAX_CACHE_SIZE: number = 1000;

function compilePath(path: string): Accessor {
    const cached: Accessor = cache.get(path);
    if (cached) return cached;

    if (cache.size > MAX_CACHE_SIZE) cache.clear();

    const keys: string[] = path.split(".");
    let fn: Accessor;

    switch (keys.length) {
        case 1:
            fn = (o) => o?.[keys[0]];
            break;
        case 2:
            fn = (o) => o?.[keys[0]]?.[keys[1]];
            break;
        case 3:
            fn = (o) => o?.[keys[0]]?.[keys[1]]?.[keys[2]];
            break;
        default:
            fn = (o) => keys.reduce((acc, k) => acc?.[k], o);
    }

    cache.set(path, fn);
    return fn;
}

export function getValueByPath(obj: any, path: string | string[]): any {
    if (!Array.isArray(path)) {
        return compilePath(path)(obj);
    }

    const len = path.length;
    if (len === 1) return obj?.[path[0]];
    if (len === 2) return obj?.[path[0]]?.[path[1]];
    if (len === 3) return obj?.[path[0]]?.[path[1]]?.[path[2]];

    const pathKey = path.join(".");
    return compilePath(pathKey)(obj);
}
