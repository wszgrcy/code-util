import { FlatRule, InlineLikeMatchOptions } from './like.type';
import { ASTViewNode } from './type';
/** @internal 获得当前节点及当前节点子级的第一个元素  */
export function getMaybeNextNodeChoice<T>(node: ASTViewNode<T>, reserve: boolean) {
    const list = [node];
    let parent = node;
    while (parent.children.length) {
        parent = parent.children[0];
        list.push(parent);
    }
    return reserve ? list.reverse() : list;
}
/** @internal 这个节点及这个节点下面的所有节点 */
export function getAllChildrenChoice<T>(node: ASTViewNode<T>, reserve: boolean): ASTViewNode<T>[] {
    return reserve
        ? [...node.children.flatMap((item) => getAllChildrenChoice(item, reserve)), node]
        : [node, ...node.children.flatMap((item) => getAllChildrenChoice(item, reserve))];
}
export function getNextNode<T>(item: ASTViewNode<T>, end: number): ASTViewNode<T> | undefined {
    if (item.parent) {
        if (item.index !== item.parent.children.length - 1) {
            const node = item.parent.children[item.index + 1];
            return !node.value ? getNextNode(node, end) : node;
        } else if (item.parent.range[1] <= end) {
            return getNextNode(item.parent, end);
        }
    }
    return undefined;
}
/** @internal */
export abstract class NodeRelationQuery<T> {
    constructor(protected ruleList: FlatRule[], protected options: InlineLikeMatchOptions) {}
    abstract nextRuleIndex(index: number): number;
    abstract hasNext(index: number): boolean;
    abstract getNextNodeMaybeList(next: ASTViewNode<T> | undefined, fuzzy: boolean): ASTViewNode<T>[];
    abstract getNextNode(item: ASTViewNode<T>, end: number): ASTViewNode<T> | undefined;
    abstract getAllNextNode(item: ASTViewNode<T>, end: number): ASTViewNode<T>[];
    abstract getNextSiblingList(start: ASTViewNode<T>): ASTViewNode<T>[];
}
/** @internal */
export class PrevNodeRelationQuery<T> extends NodeRelationQuery<T> {
    override nextRuleIndex(index: number) {
        return index - 1;
    }
    override hasNext(index: number) {
        return 0 !== index;
    }
    getNextNode(item: ASTViewNode<T>, start: number): ASTViewNode<T> | undefined {
        if (item.parent) {
            if (item.index !== 0) {
                const node = item.parent.children[item.index - 1];
                return !node.value ? this.getNextNode(node, start) : node;
            } else if (item.parent.range[0] >= start) {
                return this.getNextNode(item.parent, start);
            }
        }
        return undefined;
    }
    getAllNextNode(item: ASTViewNode<T>, end: number): ASTViewNode<T>[] {
        const list = [item];
        if (item.range[0] <= end) {
            return list.reverse();
        }
        let node: ASTViewNode<T> | undefined = item;
        while (true) {
            node = this.getNextNode(node!, end);
            if (node) {
                list.push(node);
            } else {
                return list.reverse();
            }
        }
    }
    getNextNodeMaybeList(next: ASTViewNode<T> | undefined, fuzzy: boolean): ASTViewNode<T>[] {
        if (!next) {
            return [];
        }
        // 所有next都是顶层
        return fuzzy
            ? this.#getAllChildrenChoice(next, this.options.matchLevel === 'bottom')
            : this.#getMaybeNextNodeChoice(next, this.options.matchLevel === 'bottom');
    }
    #getMaybeNextNodeChoice(node: ASTViewNode<T>, reserve: boolean) {
        const list = [node];
        let parent = node;
        while (parent.children.length) {
            parent = parent.children[parent.children.length - 1];
            list.push(parent);
        }
        return reserve ? list.reverse() : list;
    }
    #getAllChildrenChoice(node: ASTViewNode<T>, reserve: boolean): ASTViewNode<T>[] {
        return reserve
            ? [...node.children.flatMap((item) => this.#getAllChildrenChoice(item, reserve).reverse()).reverse(), node]
            : [node, ...node.children.flatMap((item) => this.#getAllChildrenChoice(item, reserve).reverse()).reverse()];
    }
    getNextSiblingList(start: ASTViewNode<T>): ASTViewNode<T>[] {
        return start.parent?.children.slice(0, start.index) || [];
    }
}
/** @internal */

export class NextNodeRelationQuery<T> extends NodeRelationQuery<T> {
    override nextRuleIndex(index: number) {
        return index + 1;
    }
    override hasNext(index: number) {
        return this.ruleList.length - 1 !== index;
    }
    getNextNode(item: ASTViewNode<T>, end: number): ASTViewNode<T> | undefined {
        if (item.parent) {
            if (item.index !== item.parent.children.length - 1) {
                const node = item.parent.children[item.index + 1];
                return !node.value ? this.getNextNode(node, end) : node;
            } else if (item.parent.range[1] <= end) {
                return this.getNextNode(item.parent, end);
            }
        }
        return undefined;
    }
    getAllNextNode(item: ASTViewNode<T>, end: number): ASTViewNode<T>[] {
        const list = [item];
        if (item.range[1] >= end) {
            return list;
        }
        let node: ASTViewNode<T> | undefined = item;
        while (true) {
            node = this.getNextNode(node!, end);
            if (node) {
                list.push(node);
            } else {
                return list;
            }
        }
    }
    getNextNodeMaybeList(next: ASTViewNode<T> | undefined, fuzzy: boolean): ASTViewNode<T>[] {
        if (!next) {
            return [];
        }
        return fuzzy
            ? getAllChildrenChoice(next, this.options.matchLevel === 'bottom')
            : getMaybeNextNodeChoice(next, this.options.matchLevel === 'bottom');
    }
    getNextSiblingList(start: ASTViewNode<T>): ASTViewNode<T>[] {
        return start.parent?.children.slice(start.index! + 1) || [];
    }
}
