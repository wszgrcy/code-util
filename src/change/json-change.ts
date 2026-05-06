import { Node } from 'jsonc-parser';
import { DeleteChange, InsertChange, ReplaceChange } from './content-change';

export class JsonChange {
    constructor() {}
    replaceKey(node: Node, newKey: string) {
        return new ReplaceChange(node.children![0].offset, node.children![0].length, newKey);
    }
    replaceValue(node: Node, newValue: string) {
        return new ReplaceChange(node.children![1].offset, node.children![1].length, newValue);
    }
    replaceNode(node: Node, content: string) {
        return new ReplaceChange(node.offset, node.length, content);
    }
    deleteNode(node: Node) {
        const parentChildren = node.parent!.children;
        const currentIndex = parentChildren!.findIndex((childNode) => childNode === node);
        let start: number;
        if (parentChildren!.length > 1 && currentIndex > 0) {
            start = parentChildren![currentIndex - 1].offset + parentChildren![currentIndex - 1].length;
        } else {
            start = node.offset;
        }
        return new DeleteChange(start, node.offset + node.length - start);
    }
    insertNode(node: Node, content: string, position: 'before' | 'after' = 'before') {
        if (position === 'before') {
            return new InsertChange(node.offset, content + ',');
        } else {
            return new InsertChange(node.offset + node.length, ',' + content);
        }
    }
    insertChildNode(node: Node, content: string) {
        const children = node.children![1].children!;
        if (children.length === 0) {
            return new InsertChange(node.children![1].offset + 1, content);
        } else {
            return this.insertNode(children[children.length - 1], content, 'after');
        }
    }
}
