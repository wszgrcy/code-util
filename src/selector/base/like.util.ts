import { ASTViewNode, NodeRange } from './type';
import { nodeInRange } from './util';

// export function getMaybeNextNodeChoice<T>(node: ASTViewNode<T>, range: NodeRange) {
//     if (!node.parent) {
//         return;
//     }
//     let isLast = node.index === node.parent.children.length - 1;
//     if (isLast) {
//         if (nodeInRange(range, node.parent.range)) {
//             return getMaybeNextNodeChoice(node.parent!, range);
//         }
//     } else {
//         let nextNode = node.parent!.children[node.index + 1];
//         return getNodeFirstList(nextNode);
//     }
// }

/** 根据索引查询这个节点的位置,给出节点查内容 */
function findFirstNode<T>(node: ASTViewNode<T>, start: number, end: number) {
    let queryList = [node];
    while (queryList.length) {
        let node = queryList.shift()!;
        if (node.range[0] <= start && end <= node.range[1]) {
            if (node.range[0] === start) {
                return findChildNode(node, start);
            } else {
                queryList = node.children.slice();
            }
        }
    }
}
function findChildNode<T>(node: ASTViewNode<T>, start: number): ASTViewNode<T>[] {
    if (!node.children.length) {
        return [node];
    }
    let list = [];
    for (const item of node.children) {
        if (item.range[0] === start) {
            if (item.children.length === 0) {
                list.push(item);
            } else {
                list.push(...findChildNode(item, start));
            }
        }
    }
    return list;
}
/** @internal */
export function* findNodeMaybeStartWith<T>(node: ASTViewNode<T>, queryString: string) {
    let length = queryString.length;
    let index = -length;
    let list = [];
    let nodeValue = node.value;
    while (true) {
        index = nodeValue.indexOf(queryString, index + length);
        if (index !== -1) {
            list.push(index);
        } else {
            break;
        }
    }
    jump1: for (const item of list) {
        let start = item + node.range[0];
        let end = start + length;
        let result;

        result = findFirstNode(node, start, end);

        // 发现一个列表,列表内的就应该去除
        if (result) {
            for (const item of result) {
                yield item;
            }
        }
    }
}

export function findSubRangeFirstEqual<T>(node: ASTViewNode<T>) {
    return node.children.filter((item) => item.range[0] === node.range[0]);
}
