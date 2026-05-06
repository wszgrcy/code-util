import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';

import { ExtraDataItem, ExtraDataLiteralItem, NodeRange } from '../base/type';
import {
    AttributeNode,
    CommentNode,
    ComponentNode,
    CompoundExpressionNode,
    ForNode,
    IfBranchNode,
    IfNode,
    InterpolationNode,
    ParserOptions,
    PlainElementNode,
    SlotOutletNode,
    TemplateChildNode,
    TemplateNode,
    TextCallNode,
    TextNode,
    parse,
    Node,
    DirectiveNode,
    SimpleExpressionNode,
} from '@vue/compiler-dom';
export function createCssSelectorForVue(htmlContent: string, options?: ParserOptions, baseOption?: BaseOptions) {
    return new CssSelectorForVue(htmlContent, options, baseOption);
}
type TypeMap = {
    PlainElementNode: PlainElementNode;
    ComponentNode: ComponentNode;
    SlotOutletNode: SlotOutletNode;
    TemplateNode: TemplateNode;
    InterpolationNode: InterpolationNode;
    CompoundExpressionNode: CompoundExpressionNode;
    TextNode: TextNode;
    CommentNode: CommentNode;
    IfNode: IfNode;
    IfBranchNode: IfBranchNode;
    ForNode: ForNode;
    TextCallNode: TextCallNode;
    AttributeNode: AttributeNode;
    DirectiveNode: DirectiveNode;
    SimpleExpressionNode: SimpleExpressionNode;
};
/** vue不提供枚举变量,需要手动声明 */
export const enum NodeTypes {
    ROOT = 0,
    ELEMENT = 1,
    TEXT = 2,
    COMMENT = 3,
    SIMPLE_EXPRESSION = 4,
    INTERPOLATION = 5,
    ATTRIBUTE = 6,
    DIRECTIVE = 7,
    COMPOUND_EXPRESSION = 8,
    IF = 9,
    IF_BRANCH = 10,
    FOR = 11,
    TEXT_CALL = 12,
    VNODE_CALL = 13,
    JS_CALL_EXPRESSION = 14,
    JS_OBJECT_EXPRESSION = 15,
    JS_PROPERTY = 16,
    JS_ARRAY_EXPRESSION = 17,
    JS_FUNCTION_EXPRESSION = 18,
    JS_CONDITIONAL_EXPRESSION = 19,
    JS_CACHE_EXPRESSION = 20,
    JS_BLOCK_STATEMENT = 21,
    JS_TEMPLATE_LITERAL = 22,
    JS_IF_STATEMENT = 23,
    JS_ASSIGNMENT_EXPRESSION = 24,
    JS_SEQUENCE_EXPRESSION = 25,
    JS_RETURN_STATEMENT = 26,
}
const enum ElementTypes {
    ELEMENT = 0,
    COMPONENT = 1,
    SLOT = 2,
    TEMPLATE = 3,
}
const nodeType = {
    PlainElementNode: (node: any): node is PlainElementNode => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.ELEMENT,
    ComponentNode: (node: any): node is ComponentNode => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.COMPONENT,
    SlotOutletNode: (node: any): node is SlotOutletNode => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT,
    TemplateNode: (node: any): node is TemplateNode => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE,

    InterpolationNode: (node: any): node is InterpolationNode => node.type === NodeTypes.INTERPOLATION,
    CompoundExpressionNode: (node: any): node is CompoundExpressionNode => node.type === NodeTypes.COMPOUND_EXPRESSION,
    TextNode: (node: any): node is TextNode => node.type === NodeTypes.TEXT,
    CommentNode: (node: any): node is CommentNode => node.type === NodeTypes.COMMENT,
    IfNode: (node: any): node is IfNode => node.type === NodeTypes.IF,
    IfBranchNode: (node: any): node is IfBranchNode => node.type === NodeTypes.IF_BRANCH,
    ForNode: (node: any): node is ForNode => node.type === NodeTypes.FOR,
    TextCallNode: (node: any): node is TextCallNode => node.type === NodeTypes.TEXT_CALL,
    /** attr */
    AttributeNode: (node: any): node is AttributeNode => node.type === NodeTypes.ATTRIBUTE,
    DirectiveNode: (node: any): node is DirectiveNode => node.type === NodeTypes.DIRECTIVE,
    SimpleExpressionNode: (node: any): node is SimpleExpressionNode => node.type === NodeTypes.SIMPLE_EXPRESSION,
};
type NodeType = typeof nodeType;

type ChildrenMap = {
    [a in keyof NodeType]: (node: TypeMap[a]) => Node[];
};

const childrenObj: ChildrenMap = {
    PlainElementNode: (node) => [...node.props, ...node.children],
    ComponentNode: (node) => [...node.props, ...node.children],
    SlotOutletNode: (node) => [...node.props, ...node.children],
    TemplateNode: (node) => [...node.props, ...node.children],
    InterpolationNode: (node) => [node.content],
    CompoundExpressionNode: (node) => [...node.children].filter((item) => typeof item === 'object') as any[],
    TextNode: (node) => [],
    CommentNode: (node) => [],
    IfNode: (node) => [...node.branches],
    IfBranchNode: (node) => [...node.children, node.userKey, node.condition].filter(Boolean) as any[],
    ForNode: (node) => [...node.children, node.source, node.valueAlias, node.keyAlias, node.objectIndexAlias].filter(Boolean) as any[],
    TextCallNode: (node) => [node.content],
    AttributeNode: (node) => [node.value].filter(Boolean) as any[],
    DirectiveNode: (node) => [node.arg, node.exp].filter(Boolean) as any[],
    SimpleExpressionNode: (node) => [node.ast, node.hoisted].filter(Boolean) as any[],
};
export class CssSelectorForVue extends CssSelectorBase<Node> {
    rootNodeList: Node[];
    constructor(protected content: string, options?: ParserOptions, baseOption?: BaseOptions) {
        super(baseOption);
        const parseTreeResult = parse(content, options);
        this.rootNodeList = parseTreeResult.children;
    }

    protected findTagName(node: Node) {
        for (const key in nodeType) {
            if ((nodeType as any)[key](node)) {
                return key;
            }
        }
        return undefined;
    }
    protected getChildren(node: Node): Node[] {
        for (const key in nodeType) {
            if ((nodeType as any)[key](node)) {
                return ((childrenObj as any)[key](node) as Node[]).sort((a, b) => a.loc.start.offset - b.loc.end.offset);
            }
        }
        return [];
    }

    override getNodePosition(node: Node): NodeRange {
        return [node.loc.start.offset!, node.loc.end.offset];
    }
    /**
     * todo 额外数据处理的不够精确
     */
    protected getNodeExtraData(
        node: Node,
        callPath: string,
        registryMap: Map<string, () => any>,
        filterList?: string[]
    ): Record<string, ExtraDataItem> {
        const result = super.getNodeExtraData(node, callPath, registryMap, ['loc']);
        if (
            nodeType.PlainElementNode(node) ||
            nodeType.ComponentNode(node) ||
            nodeType.SlotOutletNode(node) ||
            nodeType.TemplateNode(node)
        ) {
            for (let i = 0; i < node.props.length; i++) {
                const item = node.props[i];
                if (nodeType.AttributeNode(item)) {
                    result[item.name] = new ExtraDataLiteralItem(item.value?.content);
                } else {
                    if (!item.arg || nodeType.CompoundExpressionNode(item.arg)) {
                        continue;
                    }

                    result[item.arg.content] = new ExtraDataLiteralItem((item.exp as any).content);
                }
            }
        }
        return result;
    }
}
