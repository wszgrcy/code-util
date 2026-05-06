import type {
    ParseSourceSpan,
    ParseTemplateOptions,
    TmplAstBoundAttribute,
    TmplAstBoundEvent,
    TmplAstBoundText,
    TmplAstContent,
    TmplAstDeferredBlock,
    TmplAstDeferredBlockError,
    TmplAstDeferredBlockLoading,
    TmplAstDeferredBlockPlaceholder,
    TmplAstDeferredTrigger,
    TmplAstElement,
    TmplAstForLoopBlock,
    TmplAstForLoopBlockEmpty,
    TmplAstIcu,
    TmplAstIfBlock,
    TmplAstIfBlockBranch,
    TmplAstNode,
    TmplAstReference,
    TmplAstSwitchBlock,
    TmplAstSwitchBlockCase,
    TmplAstTemplate,
    TmplAstText,
    TmplAstTextAttribute,
    TmplAstUnknownBlock,
    TmplAstVariable,
} from '@angular/compiler';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { ExtraDataItem, ExtraDataLiteralItem, NodeRange } from '../base/type';
/* eslint-disable @typescript-eslint/no-explicit-any */

interface NodeIterationOptions {
    BoundAttribute: (node: TmplAstBoundAttribute) => any;
    BoundEvent: (node: TmplAstBoundEvent) => any;
    BoundText: (node: TmplAstBoundText) => any;
    Content: (node: TmplAstContent) => any;
    DeferredBlock: (node: TmplAstDeferredBlock) => any;
    DeferredBlockError: (node: TmplAstDeferredBlockError) => any;
    DeferredBlockLoading: (node: TmplAstDeferredBlockLoading) => any;
    DeferredBlockPlaceholder: (node: TmplAstDeferredBlockPlaceholder) => any;
    DeferredTrigger: (node: TmplAstDeferredTrigger) => any;
    Element: (node: TmplAstElement) => any;
    ForLoopBlock: (node: TmplAstForLoopBlock) => any;
    ForLoopBlockEmpty: (node: TmplAstForLoopBlockEmpty) => any;
    Icu: (node: TmplAstIcu) => any;
    IfBlock: (node: TmplAstIfBlock) => any;
    IfBlockBranch: (node: TmplAstIfBlockBranch) => any;
    Reference: (node: TmplAstReference) => any;
    SwitchBlock: (node: TmplAstSwitchBlock) => any;
    SwitchBlockCase: (node: TmplAstSwitchBlockCase) => any;
    Template: (node: TmplAstTemplate) => any;
    Text: (node: TmplAstText) => any;
    TextAttribute: (node: TmplAstTextAttribute) => any;
    UnknownBlock: (node: TmplAstUnknownBlock) => any;
    Variable: (node: TmplAstVariable) => any;
    default: (node: any) => any;
}
export interface Render3ParseOptions {
    collectCommentNodes: boolean;
}
const ROOT_NAME = '__root';
/**
 * 目前这个依赖包多用于node环境使用,因此升级为esm可能会导致所有依赖此包的工具全部升级,代价较大,所以目前仅仅将此方法从同步变为异步,同时升级为最新的@angular/complier依赖
 */
export async function createCssSelectorForNgHtml(
    htmlContent: string,
    options: ParseTemplateOptions & { module$$: Promise<typeof import('@angular/compiler')> },
    baseOption?: BaseOptions
) {
    return new CssSelectorForNgHtml(htmlContent, await options.module$$, options, baseOption);
}
export class CssSelectorForNgHtml extends CssSelectorBase<TmplAstNode> {
    rootNodeList: TmplAstNode[];

    constructor(
        protected content: string,
        private angularComplier: typeof import('@angular/compiler'),
        options?: ParseTemplateOptions,
        baseOption?: BaseOptions
    ) {
        super(baseOption);

        const result = this.angularComplier.parseTemplate(content, '', options);

        if (result.errors && result.errors.length) {
            throw result.errors.map((error) => error.toString()).join('\n');
        }

        this.rootNodeList = result.nodes;
    }

    protected findTagName(node: TmplAstNode) {
        return (
            (node as any).name !== ROOT_NAME &&
            this.nodeIteration(node, {
                Element: () => 'Element',
                Template: () => 'Template',
                Content: () => 'Content',
                Text: () => 'Text',
                default: () => undefined,
                BoundText: () => 'BoundText',
                TextAttribute: () => 'TextAttribute',
                BoundAttribute: () => 'BoundAttribute',
                BoundEvent: () => 'BoundEvent',
                Reference: () => 'Reference',
                Variable: () => 'Variable',
                IfBlock: () => 'IfBlock',
                IfBlockBranch: () => 'IfBlockBranch',
                ForLoopBlock: () => 'ForLoopBlock',
                ForLoopBlockEmpty: () => 'ForLoopBlockEmpty',
                DeferredBlock: () => 'DeferredBlock',
                DeferredBlockError: () => 'DeferredBlockError',
                DeferredBlockLoading: () => 'DeferredBlockLoading',
                DeferredBlockPlaceholder: () => 'DeferredBlockPlaceholder',
                SwitchBlock: () => 'SwitchBlock',
                SwitchBlockCase: () => 'SwitchBlockCase',
                Icu: () => 'Icu',
                DeferredTrigger: () => 'DeferredTrigger',
                UnknownBlock: () => 'UnknownBlock',
            })
        );
    }
    protected getChildren(node: TmplAstNode): TmplAstNode[] {
        return this.nodeIteration(node, {
            Element: (node) =>
                this.#sortNodeList([...node.attributes, ...node.inputs, ...node.outputs, ...node.references, ...node.children]),
            Template: (node) =>
                this.#sortNodeList([
                    ...node.attributes,
                    ...node.inputs,
                    ...node.outputs,
                    ...node.references,
                    ...node.templateAttrs,
                    ...node.variables,
                    ...node.children,
                ]),
            Content: () => [],
            Text: () => [],
            BoundText: () => [],
            TextAttribute: () => [],
            BoundAttribute: () => [],
            BoundEvent: () => [],
            Reference: () => [],
            Variable: () => [],
            default: () => [],
            IfBlock: (node) => this.#sortNodeList([...node.branches]),
            IfBlockBranch: (node) => this.#sortNodeList([...node.children, node.expressionAlias]),
            ForLoopBlock: (node) => this.#sortNodeList([...node.children, node.item]),
            ForLoopBlockEmpty: (node) => this.#sortNodeList([...node.children]),
            DeferredBlock: (node) => this.#sortNodeList([...node.children, node.placeholder, node.loading, node.error]),
            DeferredBlockError: (node) => this.#sortNodeList([...node.children]),
            DeferredBlockLoading: (node) => this.#sortNodeList([...node.children]),
            DeferredBlockPlaceholder: (node) => this.#sortNodeList([...node.children]),
            SwitchBlock: (node) => this.#sortNodeList([...node.cases, ...node.unknownBlocks]),
            SwitchBlockCase: (node) => this.#sortNodeList([...node.children]),
            Icu: (node) => this.#sortNodeList([...Object.values(node.placeholders)]),
            DeferredTrigger: (node) => this.#sortNodeList([]),
            UnknownBlock: (node) => this.#sortNodeList([]),
        });
    }

    private nodeIteration(node: TmplAstNode, options: NodeIterationOptions) {
        if (this.#isElement(node)) {
            return options.Element(node);
        } else if (this.#isBoundText(node)) {
            return options.BoundText(node);
        } else if (this.#isText(node)) {
            return options.Text(node);
        } else if (this.#isTemplate(node)) {
            return options.Template(node);
        } else if (this.#isContent(node)) {
            return options.Content(node);
        } else if (node instanceof this.angularComplier.TmplAstTextAttribute) {
            return options.TextAttribute(node);
        } else if (node instanceof this.angularComplier.TmplAstBoundAttribute) {
            return options.BoundAttribute(node);
        } else if (node instanceof this.angularComplier.TmplAstBoundEvent) {
            return options.BoundEvent(node);
        } else if (node instanceof this.angularComplier.TmplAstReference) {
            return options.Reference(node);
        } else if (node instanceof this.angularComplier.TmplAstVariable) {
            return options.Variable(node);
        } else if (node instanceof this.angularComplier.TmplAstIfBlock) {
            return options.IfBlock(node);
        } else if (node instanceof this.angularComplier.TmplAstIfBlockBranch) {
            return options.IfBlockBranch(node);
        } else if (node instanceof this.angularComplier.TmplAstForLoopBlock) {
            return options.ForLoopBlock(node);
        } else if (node instanceof this.angularComplier.TmplAstForLoopBlockEmpty) {
            return options.ForLoopBlockEmpty(node);
        } else if (node instanceof this.angularComplier.TmplAstDeferredBlock) {
            return options.DeferredBlock(node);
        } else if (node instanceof this.angularComplier.TmplAstDeferredBlockError) {
            return options.DeferredBlockError(node);
        } else if (node instanceof this.angularComplier.TmplAstDeferredBlockLoading) {
            return options.DeferredBlockLoading(node);
        } else if (node instanceof this.angularComplier.TmplAstDeferredBlockPlaceholder) {
            return options.DeferredBlockPlaceholder(node);
        } else if (node instanceof this.angularComplier.TmplAstSwitchBlock) {
            return options.SwitchBlock(node);
        } else if (node instanceof this.angularComplier.TmplAstSwitchBlockCase) {
            return options.SwitchBlockCase(node);
        } else if (node instanceof this.angularComplier.TmplAstIcu) {
            return options.Icu(node);
        } else if (node instanceof this.angularComplier.TmplAstDeferredTrigger) {
            return options.DeferredTrigger(node);
        } else if (node instanceof this.angularComplier.TmplAstUnknownBlock) {
            return options.UnknownBlock(node);
        }
        return options.default(node);
    }

    #isElement(node: TmplAstNode): node is TmplAstElement {
        return node instanceof this.angularComplier.TmplAstElement;
    }
    #isBoundText(node: TmplAstNode): node is TmplAstBoundText {
        return node instanceof this.angularComplier.TmplAstBoundText;
    }
    #isText(node: TmplAstNode): node is TmplAstText {
        return node instanceof this.angularComplier.TmplAstText;
    }
    #isTemplate(node: TmplAstNode): node is TmplAstTemplate {
        return node instanceof this.angularComplier.TmplAstTemplate;
    }
    #isContent(node: TmplAstNode): node is TmplAstContent {
        return node instanceof this.angularComplier.TmplAstContent;
    }

    override getNodePosition(node: TmplAstNode): NodeRange {
        return [node.sourceSpan.start.offset, node.sourceSpan.end.offset];
    }
    protected getNodeExtraData(
        node: TmplAstNode,
        callPath: string,
        registryMap: Map<string, () => any>,
        filterList?: string[]
    ): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap);
        if (this.#isElement(node)) {
            if (node.inputs.length) {
                result['input'] = new ExtraDataLiteralItem(node.inputs.map((attr) => attr.name).join(' '));
            }
            if (node.outputs.length) {
                result['output'] = new ExtraDataLiteralItem(node.outputs.map((item) => item.name).join(' '));
            }
        } else if (this.#isTemplate(node)) {
            if (node.templateAttrs.length) {
                result['templateAttr'] = new ExtraDataLiteralItem(node.templateAttrs.map((item) => item.name).join(' '));
            }
            if (node.variables.length) {
                result['variable'] = new ExtraDataLiteralItem(node.variables.map((item) => item.name).join(' '));
            }
        }
        if (this.#isElement(node) || this.#isContent(node)) {
            if (node.attributes.length) {
                result['attribute'] = new ExtraDataLiteralItem(node.attributes.map((item) => item.name).join(' '));
            }
        }
        if (this.#isTemplate(node) || this.#isElement(node)) {
            if (node.references.length) {
                result['reference'] = new ExtraDataLiteralItem(node.references.map((item) => item.name).join(' '));
            }
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

    #sortNodeList(list: ({ sourceSpan: ParseSourceSpan } | null)[]) {
        return list.filter(Boolean).sort((a, b) => a!.sourceSpan.start.offset - b!.sourceSpan.start.offset);
    }
}
