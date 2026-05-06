import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, NodeRange } from '../base/type';
import type { SyntaxNode, Parser } from '@lezer/common';
export async function createCssSelectorForLezer(
    content: string,
    options: { package$$: Promise<{ parser: Parser }> },
    baseOptions?: BaseOptions
) {
    const packageData = await options.package$$;
    return new CssSelectorForLezer(content, { parser: packageData.parser }, baseOptions);
}
type NODE = SyntaxNode;
export class CssSelectorForLezer extends CssSelectorBase<NODE> {
    rootNodeList: NODE[];
    constructor(protected content: string, options: { parser: Parser }, baseOptions?: BaseOptions) {
        super(baseOptions);
        const result = options.parser.parse(content);
        this.rootNodeList = [result.topNode];
    }

    protected override findTagName(node: NODE) {
        return node.type.name;
    }
    protected override getChildren(node: NODE): NODE[] {
        const list: SyntaxNode[] = [];
        let childNode = node.firstChild;

        while (childNode) {
            list.push(childNode);
            childNode = childNode.nextSibling;
        }
        return list;
    }

    override getNodePosition(node: NODE): NodeRange {
        return [node.from, node.to];
    }

    protected override getNodeExtraData(node: NODE, callPath: string, registryMap: Map<string, () => any>): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);
        // todo应该用这个代替attribute
        return result;
    }
}
