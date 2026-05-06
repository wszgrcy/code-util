export async function loadEsmModule<T>(modulePath: string | URL): Promise<T> {
    const namespaceObject = await new Function('modulePath', 'return import(modulePath);')(modulePath);

    // If it is not ESM then the values needed will be stored in the `default` property.
    // TODO_ESM: This can be removed once `@angular/*` packages are ESM only.
    if (namespaceObject.default) {
        return namespaceObject.default;
    } else {
        return namespaceObject;
    }
}
