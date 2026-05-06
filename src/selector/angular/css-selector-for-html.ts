import type { Element } from '@angular/compiler';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, ExtraDataLiteralItem, NodeRange } from '../base/type';

/**
 * 目前这个依赖包多用于node环境使用,因此升级为esm可能会导致所有依赖此包的工具全部升级,代价较大,所以目前仅仅将此方法从同步变为异步,同时升级为最新的@angular/complier依赖
 */
export async function createCssSelectorForHtml(
    htmlContent: string,
    options: { module$$: Promise<typeof import('@angular/compiler')> },
    baseOption?: BaseOptions
) {
    return new CssSelectorForHtml(htmlContent, await options.module$$, baseOption);
}

export class CssSelectorForHtml extends CssSelectorBase<Element> {
    rootNodeList: Element[];

    constructor(protected content: string, private angularComplier: typeof import('@angular/compiler'), baseOption?: BaseOptions) {
        super(baseOption);
        const parser = new this.angularComplier.HtmlParser();
        const parseTreeResult = parser.parse(content, '');
        if (parseTreeResult.errors && parseTreeResult.errors.length) {
            throw parseTreeResult.errors;
        }
        this.rootNodeList = parseTreeResult.rootNodes as any;
    }

    protected findTagName(node: Element) {
        return node.name;
    }
    protected getChildren(node: Element): Element[] {
        return [...(node.attrs || []), ...(node.children || [])] as any[];
    }

    override getNodePosition(node: Element): NodeRange {
        return [node.sourceSpan.start.offset, node.sourceSpan.end.offset];
    }
    protected override getNodeExtraData(
        node: Element,
        callPath: string,
        registryMap: Map<string, () => any>
    ): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);
        for (const item of node.attrs || []) {
            result[item.name] = new ExtraDataLiteralItem(item.value);
        }
        for (const key in node) {
            const item = (node as any)[key] as unknown;
            if (item instanceof this.angularComplier.ParseSourceSpan) {
                const range = [item.start.offset, item.end.offset];
                result[`${key}Range`] = new ExtraDataLiteralItem(range);
                result[`${key}Value`] = new ExtraDataLiteralItem(this.content.slice(...range));
                const fullRange = [item.fullStart.offset, item.end.offset];
                result[`${key}FullRange`] = new ExtraDataLiteralItem(fullRange);
                result[`${key}FullValue`] = new ExtraDataLiteralItem(this.content.slice(...fullRange));
            } else if (item instanceof this.angularComplier.AST) {
                const range = [item.sourceSpan.start, item.sourceSpan.end];
                result[`${key}Range`] = new ExtraDataLiteralItem(range);
                result[`${key}Value`] = new ExtraDataLiteralItem(this.content.slice(...range));
            }
        }
        return result;
    }
}
