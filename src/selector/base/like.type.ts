import { Omit } from 'lodash';
import { ASTViewNode, InferData, CommonNode, NodeRange } from './type';
import { inferClone } from './util';
import { NodeNode, ContentNode, NextFuzzyNode } from './like';

export type LikeMatchItem<T> = {
    pathList: ASTViewNode<T>[];
    matchedCountList: number[];
    infer: InferData<T>;
    last: ASTViewNode<T>;
    next?: ASTViewNode<T>;
};
export type LikeMatchList<T> = LikeMatchItem<T>[];

export class ComposedNode<T> implements CommonNode<T> {
    static create<T>(item: LikeMatchItem<T>, fileContent: string) {
        const range = [item.pathList[0].range[0], item.pathList[item.pathList.length - 1].range[1]] as NodeRange;
        return new ComposedNode(item, range, fileContent.slice(...range), inferClone(item.infer));
    }
    readonly type = 'composed';
    children: CommonNode<T, string>[];
    constructor(public item: LikeMatchItem<T>, public range: NodeRange, public value: string, public infer: InferData<T>) {
        this.children = item.pathList;
    }
}
export type LikeMatchLevel = 'all' | 'top' | 'bottom';
export interface LikeMatchOptions {
    count?: number;
    matchLevel?: LikeMatchLevel;
}
/** @internal */
export type InlineLikeMatchOptions = Omit<Required<LikeMatchOptions>, 'count'>;

export type FlatRule = (NodeNode | ContentNode | { type: 'empty' } | NextFuzzyNode) & {
    fuzzy?: boolean;
    createContext?: boolean;
    popContext?: boolean;
    exactStart?: boolean;
    exactEnd?: boolean;
};
