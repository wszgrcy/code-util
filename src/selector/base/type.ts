import { LikeMatchLevel } from './like.type';
import { inferClone } from './util';

export type InferData<T> = Record<string, ASTViewNode<T> | ASTViewNode<T>[]>;
export type EachFunction<T> = (node: ASTViewNode<T>, infer: InferData<T>) => boolean | undefined | void | ASTViewNode<T>[] | ASTViewNode<T>;
export interface QueryOptions<T> {
    eachFunction?: Record<string, EachFunction<T>>;
    matchLevel?: LikeMatchLevel;
}
export interface _QueryOptions<T> {
    limit: number;
    eachFunction?: Record<string, EachFunction<T>>;
    matchLevel?: LikeMatchLevel;
}
export interface TreeOptions {
    toJsonWithChildren?: boolean;
    toJsonWithExtra?: boolean;
}
function toJSON<NODE>(
    node: ASTViewNode<NODE>,
    options?: TreeOptions
): Pick<ASTViewNode<NODE>, 'index' | 'type' | 'value' | 'range' | 'children' | 'tag' | 'extra'> {
    return {
        index: node.index,
        type: node.type,
        value: node.value,
        range: node.range,
        children: options?.toJsonWithChildren
            ? node.children.map((item) => toJSON(item, options))
            : new Array(node.children.length).fill(undefined),
        tag: node.tag,
        extra: options?.toJsonWithExtra ? node.extra : (undefined as any),
    };
}
export class ASTViewNode<NODE> implements CommonNode<NODE> {
    #extra!: Record<string, ExtraDataItem>;
    infer!: InferData<NODE>;
    public parent?: ASTViewNode<NODE>;
    clone() {
        const node = new ASTViewNode(
            this.index,
            this.type,
            this.value,
            this.range,
            () => this.childrenFn(),
            this.extraFn,
            this.context,
            this.tag,
            this.options
        );
        node.parent = this.parent;
        return node;
    }
    /** 只在上下文存在,没有上下文正常 */
    toJSON?: () => {};
    get contentRange() {
        if (!this.children.length) {
            return this.range;
        }
        return [this.children[0].range[0], this.children[this.children.length - 1].range[1]] as NodeRange;
    }
    constructor(
        public index: number,
        /** 节点类型 */
        public type: ASTViewNodeType,
        /** 内容 */
        public value: string,
        /** 位置 */
        public range: NodeRange,
        /** @internal */
        private childrenFn: () => ASTViewNode<NODE>[],
        /** 额外数据 */
        private extraFn: () => Record<string, ExtraDataItem>,
        public context: { map: Map<string, (origin?: boolean) => any>; node: NODE },
        /** 标签 */
        public tag?: string,
        private options?: TreeOptions
    ) {
        this.toJSON = () => toJSON(this, options);
    }
    #children?: ASTViewNode<NODE>[];
    /** 子元素 */
    get children(): ASTViewNode<NODE>[] {
        if (!this.#children) {
            this.#children = this.childrenFn();
            this.#children.forEach((item) => {
                item.parent = this;
            });
        }
        return this.#children;
    }
    get extra() {
        if (!this.#extra) {
            this.#extra = this.extraFn();
        }
        return this.#extra;
    }
}
/** node是普通类型 token是最后的元素 */
export type ASTViewNodeType = 'node' | 'token';
export type NodeRange = [number, number];
export type ExtraDataItem = ExtraDataLiteralItem | ExtraDataCallItem | ExtraDataRefItem;
export class ExtraDataLiteralItem {
    readonly type = 'Literal';
    constructor(public value: string | number | boolean | Record<string, any> | undefined) {}
}
export class ExtraDataCallItem {
    readonly type = 'Call';
    constructor(public value: string) {}
}
/** 可能是节点 */
export class ExtraDataRefItem {
    readonly type = 'Node';
    constructor(public value: string) {}
}

export class NodeContext<T> {
    infer = {} as InferData<T>;
    constructor(public node: ASTViewNode<T>) {}
    /** @internal */
    clone(node: ASTViewNode<T>) {
        const instance = new NodeContext(node);
        instance.infer = inferClone(this.infer);
        return instance;
    }
}
/** 外部暴露这个,但是允许手动变更成其他的 */
export interface CommonNode<NODE_TYPE, VALUE = string> {
    type: string;
    value: VALUE;
    range: NodeRange;
    infer: InferData<NODE_TYPE>;
    children: CommonNode<NODE_TYPE, VALUE>[];
}
