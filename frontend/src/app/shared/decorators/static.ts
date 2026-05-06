import { ComponentType } from "react";

export function _static<T extends { new (...args: any[]): any }>(Constructor: T) {
    const Component = Constructor as unknown as ComponentType<any>;
    const displayName = Component.displayName || Component.name || "Component";

    class Static extends Constructor {
        static displayName = `Static(${displayName})`;

        shouldComponentUpdate(): boolean {
            return false;
        }
    }

    return Static as unknown as T;
}
