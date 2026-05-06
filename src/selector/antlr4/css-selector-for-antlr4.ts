import { BaseOptions, CssSelectorBase } from '../base/css-selector-base';
import type { CharStream, CommonTokenStream, Parser, Token, ParserRuleContext } from 'antlr4';
import type { NodeRange } from '../base/type';
export interface CssSelectorForAntlr4Options {
    loadPackage: Promise<{
        Lexer: any;
        Parser: any;
        ENTRY_NAME: string;
        CharStream: typeof CharStream;
        CommonTokenStream: typeof CommonTokenStream;
    }>;
}
export async function createCssSelectorForAntlr4(htmlContent: string, options: CssSelectorForAntlr4Options, baseOption?: BaseOptions) {
    const data = await options.loadPackage;
    return new CssSelectorForAntlr4(htmlContent, data, baseOption);
}

interface Node {
    children: Node[] | null;
    symbol?: Token;
    ruleIndex?: number;
    getText(): string;
    parentCtx: Node;
    start?: Token;
    stop?: Token;
}
export class CssSelectorForAntlr4 extends CssSelectorBase<Node> {
    rootNodeList;

    constructor(
        protected content: string,
        private options: { ENTRY_NAME: string } & Awaited<CssSelectorForAntlr4Options['loadPackage']>,
        baseOption?: BaseOptions
    ) {
        super(baseOption);
        // todo 是不是还有其他流?
        const chars = new options.CharStream(content);
        const lexer = new options.Lexer(chars);
        const tokens = new options.CommonTokenStream(lexer);
        const parser = new options.Parser(tokens) as Parser;
        const tree = (parser as any)[options.ENTRY_NAME]() as ParserRuleContext;
        this.rootNodeList = [tree] as unknown[] as Node[];
    }

    protected findTagName(node: Node) {
        if (node.ruleIndex !== undefined) {
            return this.options.Parser.ruleNames[node.ruleIndex];
        }
        return undefined;
    }
    protected getChildren(node: Node): Node[] {
        return node.children || [];
    }

    override getNodePosition(node: Node): NodeRange {
        let start;
        let end;
        if (node.symbol) {
            start = node.symbol;
            end = node.symbol;
        } else if (node.start) {
            start = node.start;
            end = node.stop || start;
        } else {
            throw new Error(`未识别节点:${node}`);
        }

        return [start.start, end.stop + 1];
    }
}
