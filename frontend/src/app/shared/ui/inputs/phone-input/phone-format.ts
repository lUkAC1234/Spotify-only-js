export function extractDigits(value: string): string {
    return value.replace(/\D/g, "");
}

export function getMaxDigits(format: string): number {
    let count: number = 0;
    for (const ch of format) {
        if (ch === "X") count++;
    }
    return count;
}

export function formatPhone(digits: string, format: string): string {
    let result: string = "";
    let digitIndex: number = 0;

    for (const ch of format) {
        if (digitIndex >= digits.length) break;
        if (ch === "X") {
            result += digits[digitIndex];
            digitIndex++;
        } else {
            result += ch;
        }
    }

    return result;
}

export function getPlaceholder(format: string): string {
    return format.replace(/X/g, "_");
}
