import type { AttributeSelector } from 'css-what';
import { Node, ParseError, parseTree, printParseErrorCode } from 'jsonc-parser';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, NodeRange } from '../base/type';

export function createCssSelectorForJson(htmlContent: string, baseOptions?: BaseOptions) {
    return new CssSelectorForJson(htmlContent, baseOptions);
}

export class CssSelectorForJson extends CssSelectorBase<Node> {
    rootNodeList: Node[];

    constructor(protected content: string, baseOptions?: BaseOptions) {
        super(baseOptions);
        const parseError: ParseError[] = [];
        const parseTreeResult = parseTree(content, parseError, { allowTrailingComma: true, disallowComments: false });
        if (parseError.length) {
            throw parseError.map((error) => `${printParseErrorCode(error.error)} at offset:${error.offset} length:${error.length}`);
        }
        this.rootNodeList = [parseTreeResult!];
    }

    protected findTagName(node: Node) {
        return node.type;
    }
    protected getChildren(node: Node): Node[] {
        return node.children || [];
    }

    override getNodePosition(node: Node): NodeRange {
        return [node.offset, node.offset + node.length];
    }

    protected override getNodeExtraData(node: Node, callPath: string, registryMap: Map<string, () => any>): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);
        delete result['children'];
        delete result['parent'];
        return result;
    }
}
