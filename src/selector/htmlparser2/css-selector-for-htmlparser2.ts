import type { AttributeSelector, PseudoElement } from 'css-what';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ElementType, Options, parseDocument } from 'htmlparser2';
import { Element, Text, ChildNode } from 'domhandler';
import { ExtraDataItem, ExtraDataLiteralItem, NodeRange } from '../base/type';

export function createCssSelectorForHtmlParser2(htmlContent: string, options?: Options, baseOption?: BaseOptions) {
    return new CssSelectorForHtmlParser2(htmlContent, options, baseOption);
}
type Node = ChildNode;

export class CssSelectorForHtmlParser2 extends CssSelectorBase<Node> {
    rootNodeList: Node[];

    constructor(protected content: string, options?: Options, baseOption?: BaseOptions) {
        super(baseOption);
        const parseTreeResult = parseDocument(content, { ...options, withStartIndices: true, withEndIndices: true });
        this.rootNodeList = parseTreeResult.children as any;
    }

    protected findTagName(node: Node) {
        if (this.isElement(node)) {
            return node.name;
        }
        return undefined;
    }
    protected getChildren(node: Node): Node[] {
        if (this.isElement(node)) {
            return node.children;
        }
        return [];
    }

    override getNodePosition(node: Node): NodeRange {
        return [node.startIndex!, node.endIndex! + 1];
    }

    isElement(node: Node): node is Element {
        if (node.type === ElementType.Tag || node.type === ElementType.Script || node.type === ElementType.Style) {
            return true;
        }
        return false;
    }
    isText(node: Node): node is Text {
        return node.type === ElementType.Text;
    }
    protected getNodeExtraData(
        node: ChildNode,
        callPath: string,
        registryMap: Map<string, () => any>,
        filterList?: string[]
    ): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);
        if (node.type === ElementType.Tag || node.type === ElementType.Script || node.type === ElementType.Style) {
            for (const [key, value] of Object.entries(node.attribs)) {
                result[key] = new ExtraDataLiteralItem(value);
            }
        }
        return result;
    }
}
