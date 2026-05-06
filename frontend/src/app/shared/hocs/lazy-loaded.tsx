import { ComponentType, PureComponent, ReactNode, Suspense } from "react";

import styles from "./lazy-loaded.module.scss";

export function lazyLoaded<T>(Component: ComponentType<T>, height: number = 0) {
    const displayName = Component.displayName || Component.name || "Component";

    return class extends PureComponent<T> {
        static displayName = `LazyLoaded(${displayName})`;

        render(): ReactNode {
            return (
                <Suspense
                    fallback={
                        <div
                            className={styles["loader-wrap"]}
                            style={{ height: height > 0 ? Math.round(height / 16) + "rem" : null }}
                        />
                    }
                >
                    <Component {...(this.props as T)} />
                </Suspense>
            );
        }
    };
}
