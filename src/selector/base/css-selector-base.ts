import { PseudoElement } from 'css-what';
import {
    ASTViewNode,
    NodeRange,
    ExtraDataCallItem,
    ExtraDataItem,
    ExtraDataLiteralItem,
    ExtraDataRefItem,
    TreeOptions,
    QueryOptions,
    _QueryOptions,
    EachFunction,
    NodeContext,
} from './type';
import { inferClone, isPlainArray, isPlainObject, nodeInRange, serializeRefData } from './util';
import { LimitType, SubQuery } from './sub-query';
import { LikeMatch } from './like-match-node';
import { parseLikeClause } from './like';
import { ComposedNode, LikeMatchOptions } from './like.type';

export interface BaseOptions {
    toJsonWithChildren?: boolean;
    toJsonWithExtra?: boolean;
}

/**
 * 通用节点模式,所有节点的数据结构相同
 * 保护类型为语言需要实现的,astTree调用
 */
export abstract class CssSelectorBase<NODE extends object> {
    abstract readonly rootNodeList: NODE[];
    /** 可选 */
    protected abstract content: string;
    constructor(private baseOptions?: BaseOptions) {}
    protected abstract getNodePosition(node: NODE): NodeRange;
    protected abstract findTagName(node: NODE): string | undefined;
    /** 用于通用节点的使用 */

    protected abstract getChildren(node: NODE): NODE[];
    /** @internal */
    likeMatch = new LikeMatch<NODE>();
    get nodeList() {
        return this.#astNodeList;
    }
    get #astNodeList() {
        if (!this.#_astNodeList) {
            this.#_astNodeList = this.getAstTree(this.rootNodeList, true, this.baseOptions).children;
        }
        return this.#_astNodeList;
    }
    /** 禁止直接使用 */
    #_astNodeList!: ASTViewNode<NODE>[];

    #query(...args: any[]) {
        let selector: string;
        let options: _QueryOptions<NODE>;
        let node: ASTViewNode<NODE> | undefined;
        if (typeof args[0] === 'string') {
            selector = args[0];
            options = { ...args[1], limit: args[3] };
        } else if (typeof args[0] === 'function') {
            const result = (args[0] as ReturnType<typeof Selector>)();
            selector = result.selector;
            options = { ...args[1], eachFunction: result.eachFunction, limit: args[3] };
        } else if (typeof args[0] === 'undefined') {
            return [];
        } else {
            node = args[0];
            selector = args[1];
            options = { ...args[2], limit: args[3] };
        }
        const nodeList = node ? [node] : this.#astNodeList;
        const subQuery = new SubQuery(
            this,
            options!,
            selector,
            nodeList.map((node) => new NodeContext(node)),
            !node ? LimitType.DescendantWithoutChild : LimitType.Descendant
        );
        return subQuery.query().map((item) => {
            const node = item.node.clone();
            node.infer = inferClone(item.infer);
            return node;
        });
    }
    // todo 加查询参数
    queryAll(node: ASTViewNode<NODE>, selector: SelectorType, options?: QueryOptions<NODE>): ASTViewNode<NODE>[];
    queryAll(selector: SelectorType, options?: QueryOptions<NODE>): ASTViewNode<NODE>[];
    queryAll(arg1: any, arg2?: any, arg3?: any) {
        return this.#query(arg1, arg2, arg3, Infinity);
    }
    queryOne(node: ASTViewNode<NODE>, selector: SelectorType, options?: QueryOptions<NODE>): ASTViewNode<NODE>;
    queryOne(selector: SelectorType, options?: QueryOptions<NODE>): ASTViewNode<NODE>;
    queryOne(arg1: any, arg2?: any, arg3?: any) {
        return this.#query(arg1, arg2, arg3, 1)[0];
    }

    match(node: ASTViewNode<NODE>, content: string, options?: LikeMatchOptions): ComposedNode<NODE>[];
    match(content: string, options?: LikeMatchOptions): ComposedNode<NODE>[];
    match(arg1: any, arg2: any, arg3?: any) {
        let content: string;
        let nodeList: ASTViewNode<NODE>[];
        let options: { count: number };
        let useGlobal = true;
        if (typeof arg1 === 'string') {
            nodeList = this.#astNodeList;
            content = arg1;
            options = arg2;
        } else {
            nodeList = [arg1];
            content = arg2;
            options = arg3;
            useGlobal = false;
        }
        const ruleList = parseLikeClause(content);

        return this.likeMatch
            .match(
                ruleList,
                nodeList.map((item) => ({
                    data: item,
                    start: useGlobal ? nodeList[0].range[0] : item.range[0],
                    end: useGlobal ? nodeList[nodeList.length - 1].range[1] : item.range[1],
                    infer: {},
                })),
                options
            )
            .map((item) => ComposedNode.create(item, this.content));
    }
    /** @ignore @internal */
    getPseudoElement(list: ASTViewNode<NODE>[], selector: PseudoElement): ASTViewNode<NODE>[] {
        return list
            .map((item) => {
                if (selector.name === 'parent') {
                    return item.parent;
                }
                if (selector.name === 'children' && selector.data) {
                    let index = +selector.data;
                    return item.children[index < 0 ? item.children.length + index : index];
                }
                const node = item;
                const rawNode = node.context!.node;
                let originData = (rawNode as any)[selector.name];
                if (!originData) {
                    return undefined;
                }
                if (selector.data) {
                    originData = originData[selector.data];
                }
                if (!originData) {
                    return undefined;
                }

                const list = node.children.slice();
                while (list.length) {
                    const item = list.shift()!;
                    if (item.context!.node === originData) {
                        return item ? item : undefined;
                    } else {
                        list.push(...item.children);
                    }
                }
                return undefined;
            })
            .filter(Boolean) as any[];
    }

    locate(position: NodeRange) {
        const resultList: { node: ASTViewNode<NODE>; pathList: number[] }[] = [];
        this.#locate(position, this.#astNodeList, resultList, []);
        return resultList;
    }
    #locate(
        position: NodeRange,
        list: ASTViewNode<NODE>[],
        resultList: { node: ASTViewNode<NODE>; pathList: number[] }[],
        pathList: number[]
    ) {
        list.forEach((item, index) => {
            if (nodeInRange(item.range, position)) {
                const subPathList = [...pathList, index];
                resultList.push({ pathList: subPathList, node: item });
                this.#locate(position, item.children, resultList, subPathList);
            }
        });
    }
    protected getNodeExtraData(
        node: NODE,
        callPath: string,
        registryMap: Map<string, () => any>,
        filterList: string[] = []
    ): Record<string, ExtraDataItem> {
        const originNode = node;
        const obj: Record<string, ExtraDataItem> = {};
        while (node !== Object.prototype) {
            for (const key of Reflect.ownKeys(node)) {
                if (typeof key !== 'string' || key === 'constructor' || Reflect.has(obj, key) || filterList.includes(key)) {
                    continue;
                }
                let item: any;
                try {
                    item = (originNode as any)[key];
                } catch (error) {
                    continue;
                }
                const methodType = typeof item;

                if (methodType === 'function') {
                    obj[key] = this.registryMethod(callPath, key, () => (originNode as any)[key](), registryMap);
                } else if (['string', 'number', 'boolean', 'undefined'].includes(methodType) || item === null) {
                    obj[key] = new ExtraDataLiteralItem(item as any);
                } else if (item instanceof Array) {
                    const result = isPlainArray(item);
                    if (result) {
                        obj[key] = new ExtraDataLiteralItem(item as any);
                    } else {
                        obj[key] = this.registryRefData(callPath, key, (origin) => (origin ? item : serializeRefData(item)), registryMap);
                    }
                } else if (methodType === 'object') {
                    const result = isPlainObject(item);
                    if (result) {
                        obj[key] = new ExtraDataLiteralItem(item as any);
                    } else {
                        obj[key] = this.registryRefData(callPath, key, (origin) => (origin ? item : serializeRefData(item)), registryMap);
                    }
                } else {
                }
            }

            node = Reflect.getPrototypeOf(node) as any;
        }
        return obj;
    }
    // 查询先搜索看看有没有,然后再查子级
    getAstTree(nodeList = this.rootNodeList, hasChildren: boolean | number = true, options?: TreeOptions) {
        const callbackMap = new Map<string, () => any>();
        const children = this.#getAstTree(nodeList, callbackMap, '', hasChildren, options);
        let node = new ASTViewNode(
            0,
            'node',
            '',
            [children[0].range[0], children[children.length - 1].range[1]],
            () => children,
            () => ({}),
            {
                map: callbackMap,
                node: undefined,
            }
        );
        node.children;
        return {
            children: children,
            callbackMap: callbackMap,
        };
    }
    /**
     * 这个方法使用的时候,一定是非通用模式
     */
    #getAstTree(
        nodeList: NODE[],
        registryMap: Map<string, () => void>,
        parentCallPath: string,
        hasChildren: boolean | number,
        options?: TreeOptions
    ): ASTViewNode<NODE>[] {
        const nextHasChildren = typeof hasChildren === 'number' ? (hasChildren > 1 ? hasChildren - 1 : false) : hasChildren;
        return nodeList.map((node, index) => {
            const tag = this.findTagName(node);
            const callPath = `${parentCallPath}[${index}]`;
            const position = this.getNodePosition(node);
            return new ASTViewNode<NODE>(
                index,
                tag ? 'node' : 'token',
                this.content.slice(...position),
                position,
                () => (hasChildren ? this.#getAstTree(this.getChildren(node), registryMap, callPath, nextHasChildren, options) : []),
                () => this.getNodeExtraData(node, callPath, registryMap),
                {
                    map: registryMap,
                    node: node,
                },
                tag,
                options
            );
        });
    }
    protected registryMethod(root: string, name: string, fn: () => any, map: Map<string, () => void>) {
        const callPath = `${root}.${name}`;
        map.set(callPath, fn);
        return new ExtraDataCallItem(callPath);
    }
    /** 引用数据 */
    protected registryRefData(root: string, name: string, fn: (origin?: boolean) => any, map: Map<string, (origin?: boolean) => void>) {
        const callPath = `${root}.${name}`;
        map.set(callPath, fn);
        return new ExtraDataRefItem(callPath);
    }
}
export function Selector<T = any>(list: TemplateStringsArray, ...args: EachFunction<T>[]) {
    return () => {
        let selector = '';
        const eachFunction = {} as Record<string, EachFunction<T>>;
        for (let i = 0; i < args.length; i++) {
            const element = list[i];
            selector += element;
            selector += i;
            eachFunction[i] = args[i];
        }
        selector += list[list.length - 1];
        return { selector, eachFunction };
    };
}
export type SelectorType = string | ReturnType<typeof Selector>;
