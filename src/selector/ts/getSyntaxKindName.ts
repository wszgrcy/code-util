import { SyntaxKind } from 'typescript';
export function getSyntaxKindName(kind: SyntaxKind) {
    return getKindCacheForApi()[kind];
}

const kindCache: { [packageName: string]: { [kind: number]: string } } = {};

function getKindCacheForApi() {
    if (kindCache['default'] == null) {
        kindCache['default'] = getKindNamesForApi();
    }
    return kindCache['default'];
}

function getKindNamesForApi() {
    // some SyntaxKinds are repeated, so only use the first one
    const kindNames: { [kind: number]: string } = {};
    for (const name of Object.keys(SyntaxKind).filter((k) => isNaN(parseInt(k, 10)))) {
        const value = SyntaxKind[name] as number;
        if (kindNames[value] == null) {
            kindNames[value] = name;
        }
    }
    return kindNames;
}
