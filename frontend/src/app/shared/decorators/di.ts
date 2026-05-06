export type ProvideIn = "root" | "local";

export interface InjectableOptions {
    provideIn?: ProvideIn;
}

export interface DIConfig {
    provideIn: ProvideIn;
}

const instances = new Map<Function, any>();
const resolutionStack = new Set<Function>();

export function injectable<T extends { new (...args: any[]): any }>(options?: InjectableOptions) {
    return function (Target: T) {
        const provideIn = options?.provideIn ?? "root";
        (Target as any).__di_config__ = { provideIn };
    };
}

export function inject<T extends { new (...args: any[]): any }>(ServiceClass: T) {
    const config: DIConfig = (ServiceClass as any).__di_config__;

    if (!config) {
        throw new Error(`${ServiceClass.name} is not marked as @injectable`);
    }

    if (config.provideIn === "local") {
        return new ServiceClass();
    }

    if (instances.has(ServiceClass)) {
        return instances.get(ServiceClass);
    }

    if (resolutionStack.has(ServiceClass)) {
        throw new Error(`Circular dependency detected`);
    }

    resolutionStack.add(ServiceClass);

    try {
        const instance = new ServiceClass();
        instances.set(ServiceClass, instance);

        instance?.init?.();

        return instance as InstanceType<T>;
    } finally {
        resolutionStack.delete(ServiceClass);
    }
}

/** Disposes dependency instance, an also calls its dispose method */
export function dispose(Class: { new (...args: any[]): any }): void {
    if (instances.has(Class)) {
        const instance = instances.get(Class);
        instance?.dispose?.();
        instances.delete(Class);
    }
}

/** Disposes all instances of dependencies with their dispose methods */
export function disposeAll(): void {
    instances.forEach((instance) => instance?.dispose?.());
    instances.clear();
}
