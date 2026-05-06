import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, NodeRange } from '../base/type';
import { CssNode, parse } from 'css-tree';
export function createCssSelectorForCSSTree(content: string, baseOptions?: BaseOptions) {
    return new CssSelectorForCSSTree(content, baseOptions);
}
type NODE = CssNode;
export class CssSelectorForCSSTree extends CssSelectorBase<NODE> {
    rootNodeList: NODE[];

    constructor(protected content: string, baseOptions?: BaseOptions) {
        super(baseOptions);
        this.rootNodeList = [parse(content, { positions: true })];
    }

    protected override findTagName(node: NODE) {
        return node.type;
    }
    protected override getChildren(node: NODE): NODE[] {
        if (
            node.type === 'AtrulePrelude' ||
            node.type === 'Block' ||
            node.type === 'Brackets' ||
            node.type === 'DeclarationList' ||
            node.type === 'Function' ||
            node.type === 'MediaQuery' ||
            node.type === 'MediaQueryList' ||
            node.type === 'Parentheses' ||
            node.type === 'PseudoClassSelector' ||
            node.type === 'PseudoElementSelector' ||
            node.type === 'Selector' ||
            node.type === 'SelectorList' ||
            node.type === 'StyleSheet' ||
            node.type === 'Value'
        ) {
            return node.children?.toArray() || [];
        }
        if (node.type === 'Rule') {
            return [node.prelude, node.block];
        }
        return [];
    }

    override getNodePosition(node: NODE): NodeRange {
        return [node.loc!.start.offset, node.loc!.end.offset];
    }

    protected override getNodeExtraData(node: NODE, callPath: string, registryMap: Map<string, () => any>): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);

        return result;
    }
}
