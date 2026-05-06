import { CstParser, EmbeddedActionsParser, IMultiModeLexerDefinition, Lexer, createToken } from 'chevrotain';
const likeOperator = createToken({ name: 'likeOperator', pattern: /\*|\^|\$|!/, push_mode: 'likeOperator', pop_mode: true });
const equalSign = createToken({ name: 'equalSign', pattern: '=', push_mode: 'likeData', pop_mode: true });
const likeValue = createToken({ name: 'likeValue', pattern: /(\\]|[^\]\s])+/, pop_mode: true });
/**
 * 分割匹配用
 */
const colon = createToken({ name: 'colon', pattern: ':', push_mode: 'valueLike' });
const maybe = createToken({ name: 'content', pattern: /(\\\[\[|\[[^\[]|[^\[])+/ });
const whitespace = createToken({ name: 'whitespace', pattern: /\s+/, group: Lexer.SKIPPED });
/** 获取变量 */
const inferLeft = createToken({ name: 'operator-left', pattern: '[[', push_mode: 'operator' });
const inferRight = createToken({ name: 'operator-right', pattern: /]]/, pop_mode: true });
const inferName = createToken({ name: 'infer-name', pattern: /\w+/ });
const anyNode = createToken({ name: 'anyNode', pattern: '?' });
const defineVarList = createToken({ name: 'varMany', pattern: '$$' });
const defineVarAppendList = createToken({ name: 'varAppend', pattern: '$+' });
const scopeLeft = createToken({ name: 'scopeLeft', pattern: /{\^?/ });
const scopeRight = createToken({ name: 'scopeRight', pattern: /\$?}/ });
const defineVar = createToken({ name: 'varOne', pattern: '$' });
// 正则
const regStart = createToken({ name: 'regStart', pattern: '/', push_mode: 'regexp', pop_mode: true });

const regContent = createToken({ name: 'regContent', pattern: /(\\\/|[^\/])+/ });
const regEndFlag = createToken({ name: 'regFlag', pattern: /\/((g|i|m|s|u|y)+)?/, pop_mode: true });
const skipAny = createToken({ name: 'skipAny', pattern: '...' });
const matchOne = createToken({ name: 'matchOne', pattern: '.' });
/** @internal */
export interface NextFuzzyNode {
    type: 'next-fuzzy';
}
/** @internal */
export interface ContentNode {
    type: 'content';
    value: string;
}
/** @internal */
export interface ScopeNode {
    type: 'scope';
    value: LikeNode[];
    exactEnd: boolean;
    exactStart: boolean;
}
/** @internal */
export interface NodeNode {
    type: 'node';
    /** 先不实现multi/ 0/1 */
    mode: 'one' | 'multi' | 'append';
    optional?: boolean;
    match?:
        | {
              operator: '*' | '^' | '$' | '=' | '!';
              value: string;
          }
        | { operator: 'regexp'; value: { pattern: string; flags: string } };
    name?: string;
}
/** @internal */
export type LikeNode = (ScopeNode | NodeNode | ContentNode | NextFuzzyNode) & { fuzzy?: boolean };

/**
 * [[$var1]]
 * [[$var1:*=value]]
 * [[$var1:/abc/xx]]
 */
const tokenList: IMultiModeLexerDefinition = {
    modes: {
        operator: [
            skipAny,
            matchOne,
            inferRight,
            scopeRight,
            defineVarAppendList,
            defineVarList,
            defineVar,
            inferName,
            anyNode,
            whitespace,
            scopeLeft,
            // match匹配进入
            colon,
        ],
        default: [inferLeft, maybe, whitespace],
        valueLike: [
            // 正则进入
            regStart,
            /** *|^|$进入 */
            likeOperator,
            equalSign,
        ],
        likeOperator: [equalSign, whitespace],
        likeData: [likeValue, whitespace],
        regexp: [regContent, regEndFlag],
    },
    defaultMode: 'default',
};
const lexer = new Lexer(tokenList);

class LikeParser extends EmbeddedActionsParser {
    program;
    constructor() {
        super(tokenList);
        const $ = this;
        const optionalFlag = $.RULE('optional', () => {
            $.CONSUME(anyNode);
            return true;
        });

        const varDefine = $.RULE('varDefine', () => {
            const type = this.OR([
                {
                    ALT: () => {
                        this.CONSUME(defineVar);
                        return 'one';
                    },
                },
                {
                    ALT: () => {
                        this.CONSUME(defineVarAppendList);
                        return 'append';
                    },
                },
                {
                    ALT: () => {
                        this.CONSUME(defineVarList);
                        return 'multi';
                    },
                },
            ]);
            const name = $.CONSUME(inferName).image;
            return { type: 'node', mode: type, name };
        });
        /** 变量插入匹配 */
        const inferRule = $.RULE('infer', () => {
            $.CONSUME(inferLeft);
            const data = $.OR([
                {
                    ALT() {
                        const data = $.SUBRULE(varDefine);
                        const optional = $.OPTION1(() => $.SUBRULE(optionalFlag));
                        return $.ACTION(() => {
                            if (optional) {
                                (data as any).optional = optional;
                            }
                            return data;
                        });
                    },
                },
                {
                    ALT() {
                        return { type: 'node', mode: 'one', optional: $.SUBRULE1(optionalFlag) };
                    },
                },
                {
                    ALT() {
                        $.CONSUME(matchOne);
                        return { type: 'node', mode: 'one', optional: false };
                    },
                },
                {
                    ALT() {
                        $.CONSUME(skipAny);
                        return { type: 'next-fuzzy' };
                    },
                },
            ]);

            const match = $.OPTION(() => {
                $.CONSUME(colon);
                return $.OR1([
                    {
                        ALT() {
                            const op = $.OPTION2(() => {
                                return $.CONSUME(likeOperator).image;
                            });
                            $.CONSUME(equalSign);
                            const value = $.CONSUME(likeValue).image;
                            return {
                                operator: op ?? '=',
                                value,
                            };
                        },
                    },
                    {
                        ALT() {
                            $.CONSUME(regStart);
                            const pattern = $.CONSUME(regContent);
                            const flags = $.CONSUME(regEndFlag);

                            return { value: { pattern: pattern.image, flags: flags.image.slice(1) || undefined }, operator: 'regexp' };
                        },
                    },
                ]);
            });
            $.CONSUME(inferRight);
            return (
                match
                    ? {
                          ...data,
                          match,
                      }
                    : data
            ) as typeof data & { match?: typeof match };
        });
        const scopeLeftRule = $.RULE('scope-left', () => {
            $.CONSUME(inferLeft);
            const data = $.CONSUME(scopeLeft);
            $.CONSUME(inferRight);
            return $.ACTION(() => ({ exact: data.image[1] === '^' }));
        });
        const scopeRightRule = $.RULE('scope-right', () => {
            $.CONSUME(inferLeft);
            const data = $.CONSUME(scopeRight);
            $.CONSUME(inferRight);
            return $.ACTION(() => ({ exact: data.image[0] === '$' }));
        });

        this.program = $.RULE('program', () => {
            let list: (
                | ReturnType<typeof inferRule>
                | {
                      readonly value: string;
                      readonly type: 'content';
                  }
            )[] = [];
            this.MANY({
                DEF: () => {
                    const result: LikeNode = this.OR([
                        {
                            ALT: () => this.SUBRULE(inferRule),
                        },
                        {
                            ALT: () => {
                                const content = this.CONSUME(maybe).image.replace(/\\\[/g, '[').trim();
                                if (!content) {
                                    return undefined;
                                }
                                return { value: content, type: 'content' } as const;
                            },
                        },
                        {
                            ALT: () => {
                                const leftData = this.SUBRULE1(scopeLeftRule);
                                const list: any[] = this.SUBRULE(this.program);
                                const rightData = this.SUBRULE1(scopeRightRule);
                                return $.ACTION(() => {
                                    if (list.length && leftData.exact) {
                                        list[0].fuzzy = false;
                                    }
                                    return {
                                        type: 'scope',
                                        value: list,
                                        exactEnd: rightData.exact,
                                        exactStart: leftData.exact,
                                    } as const;
                                });
                            },
                        },
                        {
                            ALT: () => {
                                // return this.SUBRULE1(commonInfer);
                                this.OPTION(() => {
                                    this.CONSUME(whitespace);
                                });
                                return undefined;
                            },
                        },
                    ]);
                    $.ACTION(() => {
                        if (result) {
                            if (!list.length) {
                                if (result.type === 'scope') {
                                    list = result.value;
                                    return;
                                }
                            } else {
                                if (list[list.length - 1]?.type === 'next-fuzzy') {
                                    (result as any).fuzzy = true;
                                    // list.pop();
                                }
                            }
                            list.push(result);
                        }
                    });
                },
            });
            return list;
        });

        this.performSelfAnalysis();
    }
}
const parser = new LikeParser();
/** @internal */
export function parseLikeClause(str: string) {
    const lexingResult = lexer.tokenize(str);
    parser.input = lexingResult.tokens;
    const result = parser.program();
    if (parser.errors.length) {
        throw parser.errors[0];
    }
    return result as any as LikeNode[];
}
