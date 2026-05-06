import { createSourceFile, isSourceFile, ScriptTarget, SourceFile, ScriptKind, Node } from 'typescript';
import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import { getSyntaxKindName } from './getSyntaxKindName';
import { NodeRange } from '../base/type';
export interface CssSelectorForTsOptions {
    childrenMode?: 'getChildren' | 'forEachChild';
    scriptKind?: ScriptKind;
}
const defaultOptions: CssSelectorForTsOptions = { childrenMode: 'getChildren', scriptKind: ScriptKind.TS };
export function createCssSelectorForTs(
    nodeOrString: SourceFile | string | Node,
    options?: CssSelectorForTsOptions,
    baseOption?: BaseOptions
) {
    options = { ...defaultOptions, ...options };
    if (typeof nodeOrString === 'string') {
        nodeOrString = createSourceFile('', nodeOrString, ScriptTarget.Latest, true, options.scriptKind);
    }
    return new CssSelectorForTs(nodeOrString, options, baseOption);
}

export class CssSelectorForTs extends CssSelectorBase<Node> {
    public sourceFile: SourceFile | undefined;
    /** 第一个节点只用来起 */
    rootNodeList: Node[];
    protected content!: string;
    constructor(rootNode: Node, private options: CssSelectorForTsOptions, baseOption?: BaseOptions) {
        super(baseOption);
        this.sourceFile = isSourceFile(rootNode) ? rootNode : undefined;
        this.rootNodeList = [rootNode];
        if (this.sourceFile) {
            this.content = this.sourceFile.text;
        }
    }
    /** 如果传入的rootNode不是SourceFile,那么在遍历时就需要传入sf确定子节点及text */
    public setSourceFile(sf: SourceFile) {
        this.sourceFile = sf;
        this.content = this.sourceFile.text;
    }

    protected findTagName(node: Node) {
        return getSyntaxKindName(node.kind);
    }

    protected getChildren(node: Node): Node[] {
        if (this.options.childrenMode === 'forEachChild') {
            const children: Node[] = [];
            node.forEachChild((node) => children.push(node) && undefined);
            return children;
        } else {
            return node.getChildren(this.sourceFile).slice();
        }
    }

    override getNodePosition(node: Node): NodeRange {
        return [node.getStart(this.sourceFile), node.end];
    }
    protected override getNodeExtraData(node: Node, callPath: string, registryMap: Map<string, () => void>) {
        const result = super.getNodeExtraData(node, callPath, registryMap, ['originalKeywordKind', 'isInJSDocNamespace']);
        for (const key of ['getFullStart', 'getFullWidth', 'getChildCount']) {
            if (key in node) {
                result[key] = this.registryMethod(callPath, key, () => (node as any)[key](), registryMap);
            }
        }
        for (const key of ['getFullText', 'getText']) {
            if (key in node) {
                result[key] = this.registryMethod(callPath, key, () => (node as any)[key](this.sourceFile), registryMap);
            }
        }
        const rangeWithComment = 'rangeWithComment';
        result[rangeWithComment] = this.registryMethod(
            callPath,
            rangeWithComment,
            () => [node.getStart(this.sourceFile, true), node.end],
            registryMap
        );
        return result;
    }
}
