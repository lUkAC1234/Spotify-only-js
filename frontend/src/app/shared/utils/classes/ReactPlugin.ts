export abstract class ReactAppPlugin<P> {
    plugin: P;

    constructor(plugin: new () => P) {
        this.plugin = new plugin();
    }

    abstract setup<T>(options?: T): void;
    abstract dispose(): void;
}
