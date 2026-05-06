import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import * as WTS from 'web-tree-sitter';
// import Parser from 'web-tree-sitter';
import { NodeRange } from '../base/type';
export interface CssSelectorForTreeSitterOptions {
    language: string;
    loadPackage: Promise<{
        path: string | Uint8Array;
    }>;
}
const grammarCacheMap = {} as Record<string, Promise<WTS.Language>>;
export async function createCssSelectorForTreeSitter(content: string, options: CssSelectorForTreeSitterOptions, baseOption?: BaseOptions) {
    if (!grammarCacheMap[options.language]) {
        grammarCacheMap[options.language] = new Promise(async (res) => {
            const data = await options.loadPackage;
            await WTS.Parser.init();
            res(WTS.Language.load(data.path));
        });
    }
    return new CssSelectorForTreeSitter(content, { grammar: await grammarCacheMap[options.language] }, baseOption);
}

type Node = WTS.Node;
export class CssSelectorForTreeSitter extends CssSelectorBase<Node> {
    rootNodeList;

    constructor(protected content: string, private options: { grammar: WTS.Language }, baseOption?: BaseOptions) {
        super(baseOption);
        const parser = new WTS.Parser();
        parser.setLanguage(options.grammar);
        const result = parser.parse(content);
        parser.delete();
        this.rootNodeList = [result.rootNode] as unknown[] as Node[];
    }

    protected findTagName(node: Node) {
        return node.type;
    }
    protected getChildren(node: Node): Node[] {
        return node.children;
    }

    override getNodePosition(node: Node): NodeRange {
        return [node.startIndex, node.endIndex];
    }
}
