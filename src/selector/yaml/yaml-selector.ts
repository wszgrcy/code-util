import { Parser } from 'yaml';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import type { Token } from 'yaml/dist/parse/cst';
import { NodeRange } from '../base/type';
export function createCssSelectorForYAML(content: string, baseOption?: BaseOptions) {
    return new CssSelectorForYaml(content, baseOption);
}
type NODE = Token;
export class CssSelectorForYaml extends CssSelectorBase<NODE> {
    readonly rootNodeList: NODE[];
    constructor(protected content: string, baseOption?: BaseOptions) {
        super(baseOption);
        const result = Array.from(new Parser().parse(content));
        this.rootNodeList = result;
    }
    protected findTagName(node: NODE): string | undefined {
        return node.type;
    }
    protected getChildren(node: NODE): NODE[] {
        const list = [];
        if ('start' in node && node.start) {
            if (node.start instanceof Array) {
                list.push(...node.start);
            } else {
                list.push(node.start);
            }
        }
        if ('key' in node && node.key) {
            list.push(node.key);
        }
        if ('sep' in node && (node.sep as any)?.length) {
            list.push(...(node.sep as any));
        }
        if ('value' in node && node.value) {
            list.push(node.value);
        }
        if ('items' in node && node.items) {
            for (const item of node.items) {
                list.push({ type: node.type + '-item', ...item });
            }
        }
        if ('end' in node && node.end?.length) {
            list.push(...node.end);
        }

        return list as any;
    }
    protected getNodePosition(node: NODE): NodeRange {
        let start;
        // 处理自制 item节点范围
        if (!('offset' in node)) {
            if ((node as any).type.endsWith('-item')) {
                if ('start' in node && (node as any).start?.length) {
                    start = (node as any).start[0].offset;
                } else if ('key' in node && (node as any).key) {
                    start = (node as any).key.offset;
                } else if ('sep' in node && (node as any).sep?.length) {
                    start = (node as any).sep[0].offset;
                } else if ('value' in node && (node as any).value) {
                    start = (node as any).value.offset;
                } else {
                    start = 0;
                }
            } else {
                start = 0;
            }
        } else {
            start = node.offset;
        }
        return [start, this.#findLastNode(node)];
    }
    #endCacheMap = new Map<NODE, number>();
    #findLastNode(node: NODE): number {
        if (this.#endCacheMap.has(node)) {
            return this.#endCacheMap.get(node)!;
        }
        let end;
        if ('source' in node) {
            end = node.offset + node.source.length;
        } else if ('end' in node && node.end?.length) {
            end = this.#findLastNode(node.end[node.end.length - 1]);
        } else if ('items' in node && node.items?.length) {
            end = this.#findLastNode(node.items[node.items.length - 1] as any);
        } else if ('value' in node && node.value) {
            end = this.#findLastNode(node.value);
        } else if ('sep' in node && (node.sep as any)?.length) {
            end = this.#findLastNode((node.sep as any)[(node.sep as any).length - 1] as any);
        } else if ('key' in node && node.key) {
            end = this.#findLastNode(node.key as any);
        } else if ('start' in node && node.start) {
            if (node.start instanceof Array) {
                if (node.start.length) {
                    end = this.#findLastNode(node.start[node.start.length - 1]);
                }
            } else {
                end = this.#findLastNode(node.start);
            }
        }
        if (typeof end === 'number') {
            this.#endCacheMap.set(node, end);
            return end;
        }
        throw new Error('unknown node');
    }
}
