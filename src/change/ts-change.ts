import ts, { isArrayLiteralExpression, isObjectLiteralExpression, Node, PropertyAssignment, SourceFile } from 'typescript';
import { DeleteChange, InsertChange, ReplaceChange } from './content-change';

interface NodeOptions {
    full?: boolean;
    comment?: boolean;
}
export class TsChange {
    constructor(private sourceFile: SourceFile) {}
    replaceNode(node: Node, content: string, options: NodeOptions = {}) {
        const start = this.getNodeStart(node, options);

        return new ReplaceChange(start, this.getNodeWidth(node, options), content);
    }
    deleteNode(node: Node, options: NodeOptions = {}) {
        const start = this.getNodeStart(node, options);
        return new DeleteChange(start, this.getNodeWidth(node, options));
    }
    insertNode(node: Node, content: string, pos: 'start' | 'end' = 'start', options: NodeOptions = {}) {
        const start = this.getNodeStart(node, options);

        return new InsertChange(pos === 'start' ? start : start + this.getNodeWidth(node, options), content, pos);
    }
    insertChildNode(node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, content: string, index?: number) {
        let start: number;
        let list!: ts.NodeArray<Node>;
        let startComma: boolean = false;
        let endComma: boolean = false;
        if (isObjectLiteralExpression(node)) {
            list = node.properties;
        } else if (isArrayLiteralExpression(node)) {
            list = node.elements;
        }
        index = typeof index === 'undefined' ? list.length : index;
        if (index === list.length && index !== 0 && !list.hasTrailingComma) {
            startComma = true;
        }
        if (index !== list.length || list.hasTrailingComma) {
            endComma = true;
        }
        if (index === 0) {
            start = list.pos;
        } else if (index > list.length || index === list.length) {
            start = list.end;
        } else {
            start = list[index - 1].pos + this.getNodeWidth(list[index - 1], { full: true }) + 1;
        }
        return new InsertChange(start, `${startComma ? ',' : ''}${content}${endComma ? ',' : ''}`);
    }
    deleteChildNode(
        node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
        deleteFunction: (node: ts.Node, index: number) => boolean
    ) {
        let list!: ts.NodeArray<Node>;
        if (isObjectLiteralExpression(node)) {
            list = node.properties;
        } else if (isArrayLiteralExpression(node)) {
            list = node.elements;
        }
        const deleteList: DeleteChange[] = [];
        let lastIndex!: { index: number; current: number; end: boolean };
        list.forEach((node, index) => {
            if (!deleteFunction(node, index)) {
                return;
            }
            if (lastIndex === undefined) {
                lastIndex = { index, current: index, end: false };
            } else if (lastIndex.current + 1 === index) {
                lastIndex.current++;
            } else {
                lastIndex = { index, current: index, end: false };
            }
            lastIndex.end = index === list.length - 1;
            const start = index === 0 ? list.pos : node.pos;
            const end = index === list.length - 1 ? list.end : list[index + 1].pos;
            deleteList.push(new DeleteChange(start, end - start));
        });
        if (!list.hasTrailingComma && lastIndex && lastIndex.index && lastIndex.end) {
            const start = list[lastIndex.index - 1].end;
            const end = list[lastIndex.index].pos;
            deleteList.push(new DeleteChange(start, end - start));
        }
        return deleteList;
    }
    private getNodeStart(node: Node, options: NodeOptions = {}) {
        return options.full ? node.getFullStart() : node.getStart(this.sourceFile, options.comment);
    }
    private getNodeWidth(node: Node, options: NodeOptions = {}) {
        return options.full ? node.getFullWidth() : node.getWidth(this.sourceFile);
    }
}
