import type { AttributeSelector } from 'css-what';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, NodeRange } from '../base/type';
import { parse, Statement, astVisitor } from 'pgsql-ast-parser';

export function createCssSelectorForPgsqlAstParser(content: string, baseOptions?: BaseOptions) {
    return new CssSelectorForPgsqlAstParser(content, baseOptions);
}
type NODE = Statement;
export class CssSelectorForPgsqlAstParser extends CssSelectorBase<NODE> {
    rootNodeList: NODE[];

    constructor(protected content: string, baseOptions?: BaseOptions) {
        super(baseOptions);
        this.rootNodeList = parse(content, { locationTracking: true });
        this.rootNodeList;
    }

    protected override findTagName(node: NODE) {
        return node.type;
    }
    protected override getChildren(node: NODE): NODE[] {
        const list: NODE[] = [];
        for (const key in node) {
            const element = (node as any)[key] as any;
            if (key === 'values') {
                return (element as any[]).map((item, index) => ({
                    type: `${index}`,
                    children: [...item],
                    _location: item._location,
                })) as any[];
            }
            if (element instanceof Array) {
                return element;
            } else if (element._location) {
                list.push(element);
            }
        }
        return list.sort((a, b) => a._location!.start - b._location!.start);
    }

    override getNodePosition(node: NODE): NodeRange {
        return [node._location!.start, node._location!.end];
    }

    protected override getNodeExtraData(node: NODE, callPath: string, registryMap: Map<string, () => any>): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);

        return result;
    }
}
