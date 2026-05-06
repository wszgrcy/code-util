import { AttributeSelector, Selector, SelectorType, parse } from 'css-what';
import { CssSelectorBase } from './css-selector-base';
import { ASTViewNode, NodeContext, _QueryOptions } from './type';
import { pseudoChild } from './pseudo-child';
import { parseLikeClause } from './like';

export enum LimitType {
    /**直接 查当前 */
    Default,
    /**查一级 跳过自身查子级 */
    Child,
    /**所有后代 第一次跳过 */
    Descendant,
    /**所有后代 之后查所有 */
    DescendantWithoutChild,
    /**下一个临近 */
    AdjacentSibling,
    /**所有下一个 查当前 */
    GeneralSibling,
    /**直接父级 */
    Parent,
}
enum ParserContext {
    /** 默认全局 */
    Default,
    /** 纯节点属性用 */
    Raw,
}
const pseudoClassChildEndList = ['child', 'type'];
/** @internal */
export class SubQuery<NODE extends object> {
    #limit!: LimitType;
    #inputNodeList;
    #inputLimit;
    readonly #parserContext: ParserContext = ParserContext.Default;
    #currentNodeList!: NodeContext<NODE>[];
    selector: Selector[][];
    constructor(
        private root: CssSelectorBase<NODE>,
        private queryOptions: _QueryOptions<NODE>,
        selector: string | Selector[][],
        inputNodeList: NodeContext<NODE>[],
        inputLimit: LimitType,
        parserContext = ParserContext.Default
    ) {
        this.#inputLimit = inputLimit;
        this.#inputNodeList = inputNodeList;
        if (typeof selector === 'string') {
            this.selector = parse(selector);
        } else {
            this.selector = selector;
        }
        this.#parserContext = parserContext;
    }
    #clone(
        selector: string | Selector[][],
        inputNodeList: NodeContext<NODE>[],
        inputLimit: LimitType,
        parserContext = ParserContext.Default
    ) {
        return new SubQuery(this.root, this.queryOptions, selector, inputNodeList, inputLimit, parserContext);
    }
    get #astNodeList() {
        return this.root.nodeList;
    }
    #getTagAttribute(selector: AttributeSelector, node: ASTViewNode<NODE>): { value: string } | undefined {
        const selectorName = selector.name;
        if (this.#parserContext === ParserContext.Default) {
            if (selectorName === 'tag' || selectorName === 'value' || selectorName === 'type') {
                const value = node[selectorName];
                return value ? { value: value } : undefined;
            }
        }
        const result = node.extra?.[selectorName];
        if (!result) {
            return undefined;
        }
        if (result.type === 'Literal') {
            return { value: typeof result.value === 'object' ? JSON.stringify(result.value) : `${result.value}` };
        } else if (result.type === 'Call') {
            const value = node.context!.map.get(result.value)!;
            if (!value) {
                return undefined;
            }
            return { value: value() };
        }

        return undefined;
    }
    #findAttribute(selector: AttributeSelector, node: ASTViewNode<NODE>): boolean {
        const attribute = this.#getTagAttribute(selector, node);
        if (attribute) {
            let str: string;
            try {
                str = attribute.value;
                switch (selector.action) {
                    case 'equals':
                        return str === selector.value;
                    case 'any':
                        return str.includes(selector.value);
                    case 'start':
                        return str.startsWith(selector.value);
                    case 'end':
                        return str.endsWith(selector.value);
                    case 'element':
                        return str.split(' ').includes(selector.value);
                    case 'hyphen':
                        return str.split(' ')[0].split('-')[0] === selector.value;
                    case 'not':
                        return str !== selector.value;
                    case 'exists':
                        return !!attribute;
                }
            } catch (error) {}
        }
        return false;
    }
    #getChildren(node: ASTViewNode<NODE>) {
        return node.children;
    }
    #getParentChildren(nodeContext: ASTViewNode<NODE>) {
        const parent = nodeContext.parent;
        return parent?.children || [];
    }
    /**
     * todo 需要确定查询数量
     */
    query() {
        const selectedList = new Set<NodeContext<NODE>>();
        const nodeMap = new Set<ASTViewNode<NODE>>();
        // raw访问使用
        if (this.#parserContext === ParserContext.Raw && this.selector.length > 1) {
            return [];
        }
        for (let i = 0; i < this.selector.length; i++) {
            this.#currentNodeList = this.#inputNodeList.slice();
            this.#limit = this.#inputLimit;
            const selectorList = this.selector[i];
            for (let j = 0; j < selectorList.length; j++) {
                const selector = selectorList[j];
                if (this.#parserContext === ParserContext.Raw && selector.type !== SelectorType.Attribute) {
                    return [];
                }
                if (!this.#parse(selector)) {
                    break;
                }
            }
            for (const item of this.#currentNodeList) {
                if (!nodeMap.has(item.node)) {
                    selectedList.add(item);
                    nodeMap.add(item.node);
                }
            }
            //fixme 只查询一定数量的,目前这么实现,未来改成子类独立实例化可以保证最少查询
            if (selectedList.size >= this.queryOptions.limit) {
                // todo
                break;
            }
        }
        return [...selectedList];
    }
    #parse(selector: Selector): boolean {
        switch (selector.type) {
            // [查询]匹配标签
            case 'tag':
                this.#currentNodeList = this.#currentNodeList.flatMap((item) =>
                    this.#findNode([item.node], (node) => node.tag === selector.name, this.#limit).map((node) => item.clone(node))
                );
                this.#limit = LimitType.Default;
                break;
            // [查询][] .xxx
            case 'attribute':
                this.#currentNodeList = this.#currentNodeList.flatMap((item) =>
                    this.#findNode([item.node], (node) => this.#findAttribute(selector as AttributeSelector, node), this.#limit).map(
                        (node) => item.clone(node)
                    )
                );

                this.#limit = LimitType.Default;
                break;
            // [查询]*
            case 'universal':
                this.#currentNodeList = this.#currentNodeList.flatMap((item) =>
                    this.#findNode([item.node], (node) => true, this.#limit).map((node) => item.clone(node))
                );
                this.#limit = LimitType.Default;
                break;
            // [查询]:xx
            case 'pseudo':
                if (selector.name === 'not') {
                    const list = this.#currentNodeList.flatMap((item) =>
                        this.#findNode([item.node], (node) => true, this.#limit).map((node) => item.clone(node))
                    );
                    const subQuery = this.#clone(selector.data as any, list, LimitType.Default);
                    const result = subQuery.query();
                    const nodeList = result.map((item) => item.node);
                    this.#currentNodeList = list.filter((item) => !nodeList.includes(item.node));
                    this.#limit = LimitType.Default;
                } else if (selector.name === 'has') {
                    const outList = [];
                    const list = this.#currentNodeList.flatMap((item) =>
                        this.#findNode([item.node], (node) => true, this.#limit).map((node) => item.clone(node))
                    );

                    // todo has可以查兄弟就相当于& xxxx操作
                    for (const item of list.slice()) {
                        const subQuery = this.#clone(selector.data as any, [item], LimitType.Descendant);
                        const result = subQuery.query();
                        if (result.length) {
                            item.infer = { ...item.infer, ...result[0].infer };
                            outList.push(item);
                        }
                    }
                    this.#currentNodeList = outList;
                    this.#limit = LimitType.Default;
                } else if (selector.name === 'is' || selector.name === 'where') {
                    // todo 应该做到限制查询类型保证,也就是只能存在一次查询没有空格
                    // 与not类似，可以理解为not的反向
                    const list = this.#currentNodeList.flatMap((item) =>
                        this.#findNode([item.node], (node) => true, this.#limit).map((node) => item.clone(node))
                    );
                    const subQuery = this.#clone(selector.data as any, list, LimitType.Default);
                    const result = subQuery.query();
                    const nodeList = list.map((item) => item.node);

                    this.#currentNodeList = result.filter((item) => nodeList.includes(item.node));
                    this.#limit = LimitType.Default;
                } else if (selector.name === 'use') {
                    // todo
                    // fixme 因为css-what没有解析.可能是因为非标准伪类的原因
                    const list = this.#currentNodeList.flatMap((item) =>
                        this.#findNode([item.node], (node) => true, this.#limit).map((node) => item.clone(node))
                    );

                    const subQuery = this.#clone(selector.data as any, list, LimitType.Default);
                    const result = subQuery.query();

                    this.#currentNodeList = result;
                    this.#limit = LimitType.Default;
                } else if (pseudoClassChildEndList.some((item) => selector.name.endsWith(item))) {
                    this.#currentNodeList = this.#currentNodeList.flatMap((item) =>
                        pseudoChild(selector, [item.node], this.#astNodeList).map((node) => item.clone(node))
                    );
                    this.#limit = LimitType.Default;
                } else if (selector.name === 'raw') {
                    const subQuery = this.#clone(selector.data as any, this.#currentNodeList, LimitType.Default, ParserContext.Raw);
                    const result = subQuery.query();
                    this.#currentNodeList = result;
                    this.#limit = LimitType.Default;
                } else if (selector.name === 'each') {
                    const data = selector.data as any as string;
                    const list: NodeContext<NODE>[] = [];
                    for (const item of this.#currentNodeList) {
                        const result = this.queryOptions.eachFunction![data](item.node, item.infer);
                        if (result instanceof Array) {
                            list.push(...result.map((node) => item.clone(node)));
                        } else if (result instanceof ASTViewNode) {
                            list.push(item.clone(result));
                        } else if (result || typeof result === 'undefined') {
                            list.push(item);
                        }
                    }
                    this.#currentNodeList = list;
                } else if (selector.name === 'infer') {
                    const name = selector.data as string;
                    for (const item of this.#currentNodeList) {
                        item.infer[name] = item.node;
                    }
                } else if (selector.name === 'like') {
                    const ruleList = parseLikeClause(selector.data as string);
                    this.#currentNodeList = this.#currentNodeList.filter((item) => {
                        const result = this.root.likeMatch.match(
                            ruleList,
                            [item].map((item) => ({
                                data: item.node,
                                end: item.node.range[1],
                                start: item.node.range[0],
                                infer: item.infer,
                            })),
                            // todo 这里的matchlevel,不影响结果,但是影响infer
                            { count: 1, matchLevel: this.queryOptions.matchLevel || 'bottom' }
                        );
                        for (const matchItem of result) {
                            item.infer = matchItem.infer;
                            return true;
                        }

                        return false;
                    });
                } else {
                    throw new Error(`pseudo: ${selector.type} not support`);
                }
                break;
            // [限定]空格
            case 'descendant':
                this.#limit = LimitType.Descendant;
                break;
            // [限定]+
            case 'adjacent':
                this.#limit = LimitType.AdjacentSibling;
                break;
            // [限定]>
            case 'child':
                this.#limit = LimitType.Child;
                break;
            // [限定]<
            case 'parent':
                this.#limit = LimitType.Parent;
                break;
            // [限定]~
            case 'sibling':
                this.#limit = LimitType.GeneralSibling;
                break;
            case 'pseudo-element':
                this.#currentNodeList = this.#currentNodeList
                    .map((item) => {
                        const result = this.root.getPseudoElement([item.node], selector)[0];
                        return result ? item.clone(result) : undefined;
                    })
                    .filter(Boolean) as any[];
                this.#limit = LimitType.Default;
                break;
            default:
                throw new Error(`${selector.type} not support`);
        }
        return !!this.#currentNodeList.length;
    }
    #findNode(list: ASTViewNode<NODE>[], filter: (node: ASTViewNode<NODE>) => boolean, limit: LimitType) {
        let resultList: ASTViewNode<NODE>[] = [];

        for (let index = 0; index < list.length; index++) {
            const nodeContext = list[index];
            if (limit === LimitType.Default || limit === LimitType.DescendantWithoutChild) {
                if (filter(nodeContext)) {
                    resultList.push(nodeContext);
                }
            } else if (limit === LimitType.AdjacentSibling) {
                const sibling = this.#getParentChildren(nodeContext);
                const nextSibling = sibling[nodeContext.index + 1];
                if (!nextSibling) {
                    continue;
                }
                const nextNodeContext = nextSibling;
                if (filter(nextNodeContext)) {
                    resultList.push(nextNodeContext);
                }
            } else if (limit === LimitType.GeneralSibling) {
                const sibling = this.#getParentChildren(nodeContext);
                const generalSiblingList = sibling.filter((_, i) => i > nodeContext.index);

                resultList = [...resultList, ...this.#findNode(generalSiblingList, filter, LimitType.Default)];
            } else if (limit === LimitType.Parent) {
                const parentNodeContext = nodeContext.parent;
                if (parentNodeContext && filter(parentNodeContext)) {
                    resultList.push(parentNodeContext);
                }
            }
            if (limit === LimitType.Descendant || limit === LimitType.DescendantWithoutChild || limit === LimitType.Child) {
                resultList = [
                    ...resultList,
                    ...this.#findNode(
                        this.#getChildren(nodeContext),
                        filter,
                        limit === LimitType.Child ? LimitType.Default : LimitType.DescendantWithoutChild
                    ),
                ];
            }
        }
        return resultList;
    }
}
