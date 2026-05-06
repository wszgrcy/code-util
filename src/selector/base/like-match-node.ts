import { ContentNode, LikeNode, NextFuzzyNode, NodeNode, ScopeNode, parseLikeClause } from './like';
import { LikeMatchList, LikeMatchItem, LikeMatchOptions, InlineLikeMatchOptions, FlatRule } from './like.type';
import { findNodeMaybeStartWith, findSubRangeFirstEqual } from './like.util';
import { ASTViewNode, InferData } from './type';
import { inferClone } from './util';
import { NextNodeRelationQuery, NodeRelationQuery, PrevNodeRelationQuery, getNextNode } from './node-rel';

class MemoryCache<T> {
    #map = new Map<ASTViewNode<T>, Map<string, Map<number, ASTViewNode<T>[][]>>>();
    has(node: ASTViewNode<T>, content: string, end: number) {
        if (!this.#map.has(node)) {
            return false;
        }
        const nodeData = this.#map.get(node)!;
        if (!nodeData.has(content)) {
            return false;
        }
        return nodeData.get(content)!.has(end);
    }
    set(value: ASTViewNode<T>[][], node: ASTViewNode<T>, content: string, end: number) {
        if (!this.#map.has(node)) {
            this.#map.set(node, new Map());
        }
        const nodeData = this.#map.get(node)!;
        if (!nodeData.has(content)) {
            nodeData.set(content, new Map());
        }
        const ruleData = nodeData.get(content)!;
        ruleData.set(end, value);
    }
    get(node: ASTViewNode<T>, content: string, end: number) {
        return this.#map.get(node)?.get(content)?.get(end);
    }
}

const DEFAULT_LIKE_MATCH_OPTIONS: LikeMatchOptions = {
    count: Infinity,
    matchLevel: 'bottom',
};

class MatchContext {
    constructor(public option: { exactEnd: boolean; exactStart: boolean }, public parent?: MatchContext) {}
    data!: { preNode: ASTViewNode<any> };
    endRange!: number;
    start!: number;
    end!: number;
    createContext(option: { exactEnd: boolean; exactStart: boolean }) {
        return new MatchContext(option, this);
    }
    isRangeMatched(matchedCountList: number[]) {
        return (
            matchedCountList.slice(this.start, this.end + 1).reduce((count, value) => {
                return count + value;
            }, 0) > 0
        );
    }
}

/**
 * @internal
 * 记忆化搜索添加
 * 节点在指定搜索域下的执行范围进行查询时,一定结果相同
 */
export class LikeMatch<T> {
    #memoryCache!: MemoryCache<T>;
    constructor() {}
    #scopeExpand(ruleList: ReturnType<typeof parseLikeClause>, scopeData?: ScopeNode): FlatRule[] {
        if (scopeData && ruleList.length) {
            if (scopeData.exactStart) {
                ruleList[0].fuzzy = scopeData.exactStart ? !scopeData.exactStart : true;
                (ruleList[0] as any).exactStart = scopeData.exactStart;
            } else {
                ruleList[0].fuzzy = true;
            }
            (ruleList[0] as any).exactEnd = scopeData.exactEnd;
            (ruleList[0] as any).createContext = true;
            // (ruleList[0] as any).createContext = true;
            (ruleList[ruleList.length - 1] as any).popContext = true;
            // todo 其他
        }
        if (ruleList.length) {
            let newList = [];
            for (const item of ruleList) {
                if (item.type === 'scope') {
                    newList.push(...this.#scopeExpand(item.value, item));
                } else {
                    newList.push(item);
                }
            }
            return newList;
        } else {
            return [{ type: 'empty', createContext: true, popContext: true }];
        }
    }
    #querySeparate(list: FlatRule[]) {
        for (let index = 0; index < list.length; index++) {
            const item = list[index];
            if (item.type === 'content') {
                if (list[index - 1]?.type === 'next-fuzzy') {
                    return { pre: [], next: list };
                } else {
                    // 每一个规则都是精确的因为已经确定了
                    let pre = list.slice(0, index);
                    pre.forEach((item) => {
                        item.fuzzy = false;
                    });
                    return { pre: pre, next: list.slice(index) };
                }
            } else if (item.createContext || item.popContext) {
                return { pre: [], next: list };
            }
        }
        return { pre: [], next: list };
    }
    match(
        ruleList: ReturnType<typeof parseLikeClause>,
        /** 以这些节点开头搜索 */
        nodeList: { data: ASTViewNode<T>; infer: Record<string, any>; start: number; end: number }[],
        options?: LikeMatchOptions
    ) {
        if (!ruleList.length) {
            return [];
        }
        this.#memoryCache = new MemoryCache();
        const list = [];
        for (const item of this.#likeMatchNode(this.#scopeExpand(ruleList), nodeList, {
            ...DEFAULT_LIKE_MATCH_OPTIONS,
            ...options,
        } as any)) {
            // 查询结果需要再进行反向查询,保证反向查询内容
            list.push(item);
            if (options?.count === list.length) {
                return list;
            }
        }
        this.#memoryCache = undefined as any;
        return list;
    }
    *#likeMatchNode(
        ruleList: FlatRule[],
        /** 以这些节点开头搜索 */
        nodeList: { data: ASTViewNode<T>; infer: Record<string, any>; end: number; start: number }[],
        options: InlineLikeMatchOptions
    ) {
        let queryObj = this.#querySeparate(ruleList);
        const newList: LikeMatchList<T> = [];
        for (const inputNodeItem of nodeList) {
            // 普通查询
            let context = new MatchContext({ exactEnd: false, exactStart: false });
            context.endRange = inputNodeItem.end;
            const result = this.#matchLimit(
                queryObj.next,
                0,
                {
                    pathList: [],
                    matchedCountList: [],
                    last: inputNodeItem.data,
                    next: inputNodeItem.data,
                    infer: inputNodeItem.infer,
                },
                options,
                context,
                new NextNodeRelationQuery(queryObj.next, options)
            );
            for (const item of result) {
                if (this.#unionMatch(newList, item)) {
                    if (!queryObj.pre.length) {
                        yield item;
                    } else {
                        // 回溯查询
                        let context = new MatchContext({ exactEnd: false, exactStart: false });
                        context.endRange = inputNodeItem.start;
                        let relQuery = new PrevNodeRelationQuery<T>(queryObj.next, options);
                        const result = this.#matchLimit(
                            queryObj.pre,
                            queryObj.pre.length - 1,
                            {
                                pathList: [],
                                matchedCountList: [],
                                last: item.pathList[0],
                                next: relQuery.getNextNode(item.pathList[0], inputNodeItem.start),
                                infer: item.infer,
                            },
                            options,
                            context,
                            relQuery
                        );
                        for (const preItem of result) {
                            // todo 中list的顺序问题
                            let newItem: LikeMatchItem<T> = {
                                infer: preItem.infer,
                                pathList: [...preItem.pathList.reverse(), ...item.pathList],
                                matchedCountList: [...preItem.matchedCountList.reverse(), ...item.matchedCountList],
                                last: item.last,
                            };
                            if (this.#unionMatch(newList, newItem)) {
                                yield newItem;
                                newList.push(newItem);
                            }
                        }
                    }
                }
            }
        }
    }
    /** 反向查询
     * 1.不能有搜索域
     * 2.抽象出来获取前一个,下一个节点
     */
    *#matchLimit(
        ruleList: FlatRule[],
        index: number,
        item: LikeMatchItem<T>,
        options: InlineLikeMatchOptions,
        context: MatchContext,
        queryOptions: NodeRelationQuery<T>
    ): Generator<LikeMatchItem<T>, void, unknown> {
        const { pathList, infer, last, next, matchedCountList } = item;
        const ruleItem = ruleList[index];
        const fuzzy = ruleItem.fuzzy ?? index === 0;
        if (!next && ruleItem.type !== 'node') {
            return;
        }
        const toChild = (item: { pathList: ASTViewNode<T>[]; infer: Record<string, any>; last: ASTViewNode<T>; next?: ASTViewNode<T> }) =>
            ({
                next: item.next ?? queryOptions.getNextNode(item.last, context.endRange),
                last: item.last,
                infer: item.infer,
                pathList: [...pathList, ...item.pathList],
                matchedCountList: [...matchedCountList, item.pathList.length],
            } as LikeMatchItem<T>);
        /** 本层临时匹配 */
        let gen;
        if (ruleItem.type === 'content') {
            gen = this.#contentLikeItem(ruleItem, next!, context.endRange, fuzzy, infer);
        } else if (ruleItem.type === 'node') {
            gen = this.#nodeLikeItem(ruleItem, fuzzy, next, infer, last, queryOptions);
        } else if (ruleItem.type === 'next-fuzzy') {
            gen = (function* () {
                // 找到后面所有的节点,然后再生成
                let list = queryOptions.getAllNextNode(next!, context.endRange);
                for (const node of list) {
                    yield { last: item.last, pathList: [], infer: infer, next: node };
                }
            })();
        } else if (ruleItem.type === 'empty') {
            gen = (function* () {
                yield { last: item.last, pathList: [], infer: infer };
            })();
        }
        const notLastRule = queryOptions.hasNext(index);
        const list = [];
        /** 最后一条规则统计数字 */
        // 进行循环
        if (notLastRule) {
            let nextContext = context;
            let nextOffset = queryOptions.nextRuleIndex(index);
            let nextRule = ruleList[nextOffset];
            defaultGen: for (const defaultItem of gen!) {
                let queryNodeList = [];
                if (nextRule.createContext) {
                    nextContext = context.createContext({ exactEnd: !!nextRule.exactEnd, exactStart: !!nextRule.exactStart });
                    nextContext.start = nextOffset;
                    queryNodeList = queryOptions.getNextSiblingList(defaultItem.last).map((node) =>
                        toChild({
                            pathList: defaultItem.pathList,
                            last: defaultItem.last,
                            infer: defaultItem.infer,
                            next: node,
                        })
                    );
                    if (queryNodeList.length) {
                        nextContext.endRange = defaultItem.last.parent!.range[1];
                    }
                    if (nextContext.option.exactStart) {
                        queryNodeList = queryNodeList.slice(0, 1);
                    }
                    nextContext.data = { preNode: defaultItem.last };
                } else if (ruleItem.popContext) {
                    let preNode = context.data.preNode;
                    context.end = index;
                    let includeList = queryOptions.getNextSiblingList(preNode);
                    let scopeMatched = context.isRangeMatched([...matchedCountList, defaultItem.pathList.length]);

                    if (!scopeMatched) {
                        queryNodeList = includeList.map((node) => toChild({ ...defaultItem, next: node }));
                    } else {
                        // 保证精确匹配时它一定是父级的最后一个节点才算数
                        let maybeLastNode = defaultItem.last;
                        while (maybeLastNode) {
                            if (context.option.exactEnd) {
                                if (
                                    maybeLastNode.parent !== preNode.parent &&
                                    maybeLastNode.parent &&
                                    maybeLastNode.parent.children.length !== maybeLastNode.index + 1
                                ) {
                                    queryNodeList = [];
                                    break;
                                }
                            }
                            if (maybeLastNode.parent === preNode.parent) {
                                break;
                            }
                            maybeLastNode = maybeLastNode.parent!;
                        }
                        if (!maybeLastNode) {
                            queryNodeList = [];
                            break;
                        }
                        const i = includeList.indexOf(maybeLastNode);
                        if (context.option.exactEnd) {
                            queryNodeList = includeList[i + 1] ? [toChild({ ...defaultItem, next: includeList[i + 1] })] : [];
                        } else {
                            queryNodeList = includeList.slice(i + 1).map((node) => toChild({ ...defaultItem, next: node }));
                        }
                    }

                    nextContext = context.parent!;
                } else {
                    queryNodeList = [toChild(defaultItem)];
                }
                for (const item of queryNodeList) {
                    const result = this.#matchLimit(ruleList, queryOptions.nextRuleIndex(index), item, options, nextContext, queryOptions);
                    let hasResult = false;
                    for (const item of result) {
                        hasResult = true;
                        if (this.#unionMatch(list, item)) {
                            yield item;
                            list.push(item);
                        }
                    }
                    if (ruleItem.type === 'node' && options.matchLevel !== 'all' && hasResult) {
                        break defaultGen;
                    }
                }
            }
        } else {
            // gen要允许list 因为模糊搜索的原因,会出现多个搜索列,每个搜索列的匹配层级独立
            for (const item of gen!) {
                yield toChild(item);

                if (ruleItem.type === 'node' && options.matchLevel !== 'all') {
                    break;
                }
            }
        }
    }

    #unionMatch(list: { pathList: ASTViewNode<T>[] }[], node: { pathList: ASTViewNode<T>[] }) {
        if (!list.length) {
            return true;
        }
        return list.every((origin) => {
            if (origin.pathList.length !== node.pathList.length) {
                return true;
            }
            for (let j = 0; j < origin.pathList.length; j++) {
                if (origin.pathList[j] !== node.pathList[j]) {
                    return true;
                }
            }
            return false;
        });
    }

    *#nodeLikeItem(
        ruleItem: NodeNode,
        fuzzy: boolean,
        next: ASTViewNode<T> | undefined,
        infer: InferData<T>,
        last: ASTViewNode<T>,
        queryOptions: NodeRelationQuery<T>
    ) {
        // 如果是顶级,那么顺序为从上到下
        // bottom 从下到上
        // 如果成功还需要中断
        const maybeList = queryOptions.getNextNodeMaybeList(next, fuzzy);

        for (const maybeItem of maybeList) {
            let matched = false;
            if (ruleItem.match) {
                if (ruleItem.match.operator === '=' && maybeItem.value === ruleItem.match.value) {
                    matched = true;
                } else if (ruleItem.match.operator === '*' && maybeItem.value.includes(ruleItem.match.value)) {
                    matched = true;
                } else if (ruleItem.match.operator === '^' && maybeItem.value.startsWith(ruleItem.match.value)) {
                    matched = true;
                } else if (ruleItem.match.operator === '$' && maybeItem.value.endsWith(ruleItem.match.value)) {
                    matched = true;
                } else if (ruleItem.match.operator === '!' && maybeItem.value !== ruleItem.match.value) {
                    matched = true;
                } else if (
                    ruleItem.match.operator === 'regexp' &&
                    new RegExp(ruleItem.match.value.pattern, ruleItem.match.value.flags).test(maybeItem.value)
                ) {
                    matched = true;
                }
            } else {
                matched = true;
            }
            if (!matched) {
                continue;
            }

            const newInfer = inferClone(infer);
            if (ruleItem.name) {
                if (ruleItem.mode === 'one') {
                    const data = newInfer[ruleItem.name];
                    if (!data) {
                        newInfer[ruleItem.name] = maybeItem;
                    } else if (data !== maybeItem) {
                        continue;
                    }
                } else if (ruleItem.mode === 'append') {
                    const list = (infer[ruleItem.name] || []) as ASTViewNode<T>[];
                    list.push(maybeItem);
                    newInfer[ruleItem.name] = list;
                }
            }
            yield {
                pathList: [maybeItem],
                infer: newInfer,
                last: maybeItem,
            };
        }
        if (ruleItem.optional) {
            yield {
                pathList: [],
                infer: infer,
                last: last,
            };
        }
    }
    *#contentLikeItem(
        ruleItem: ContentNode,
        nextNode: ASTViewNode<T>,
        end: number,
        fuzzy: boolean,
        infer: InferData<T>,
        scopeRightNode?: ASTViewNode<T>
    ) {
        let list = [];
        // fixme 如果出现自定义解析怪癖,这里就有问题
        let result = /^\w+/.exec(ruleItem.value);
        // 模糊搜索修改
        for (const pathList of this.#contentLike(
            ruleItem.value,
            fuzzy ? findNodeMaybeStartWith(nextNode, result ? result[0] : ruleItem.value[0]) : [nextNode],
            end
        )) {
            yield {
                pathList: scopeRightNode ? [scopeRightNode, ...pathList] : pathList,
                infer: infer,
                last: pathList[pathList.length - 1],
            };

            list.push(pathList);
        }
    }
    *#contentLike(
        inputStr: string,
        nodeList: ASTViewNode<T>[] | Generator<ASTViewNode<T>, void, unknown>,
        end: number
    ): Generator<ASTViewNode<T>[], void, unknown> {
        for (const item of nodeList) {
            if (!item.value.trim()) {
                continue;
            }
            if (this.#memoryCache.has(item, inputStr, end)) {
                let list = this.#memoryCache.get(item, inputStr, end)!;
                for (const item of list) {
                    yield item;
                }
                continue;
            } else {
                let allList = [];
                if (inputStr === item.value) {
                    let value = [item];
                    yield value;
                    allList.push(value);
                } else {
                    let matchedStr = '';
                    /** 匹配索引 */
                    let j = 0;
                    /** 字符索引 */
                    let i = 0;
                    for (; i < inputStr.length; i++) {
                        const char = inputStr[i];
                        // i有问题
                        if (char === item.value[j]) {
                            matchedStr += char;
                            j++;
                        } else if (/\s/.test(char) && !matchedStr) {
                            continue;
                        } else {
                            if (matchedStr) {
                                // 精确匹配也应该找?
                                for (const value of this.#contentLike(inputStr, findSubRangeFirstEqual(item), end)) {
                                    yield value;
                                    allList.push(value);
                                }
                            }
                            // 失败
                            break;
                        }
                        // 这个节点已经完全匹配完成
                        if (j === item.value.length) {
                            if (i === inputStr.length - 1) {
                                let value = [item];
                                yield value;
                                allList.push(value);
                                break;
                            }

                            const nextNode = getNextNode(item, end);
                            if (nextNode && !/^\w{2}$/.test(inputStr.slice(i, i + 2))) {
                                const result = this.#contentLike(inputStr.slice(i + 1), [nextNode], end);
                                for (const list of result) {
                                    let value = [item, ...list];
                                    yield value;
                                    allList.push(value);
                                }
                            }
                            break;
                        } else if (i === inputStr.length - 1) {
                            for (const value of this.#contentLike(inputStr, findSubRangeFirstEqual(item), end)) {
                                yield value;
                                allList.push(value);
                            }
                            break;
                        }
                    }
                }
                this.#memoryCache.set(allList, item, inputStr, end);
            }
        }
    }
}
