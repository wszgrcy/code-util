import { parseLikeClause } from './like';
import { expect } from 'chai';
describe('like', () => {
    it('parser', () => {
        let result = parseLikeClause('[[$var1]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var1' }]);
        result = parseLikeClause('hello world');
        expect(result).deep.eq([{ value: 'hello world', type: 'content' }]);
        result = parseLikeClause('\\[[$var1]]');
        expect(result).deep.eq([{ value: '[[$var1]]', type: 'content' }]);
        result = parseLikeClause('hello[[$var1]]');
        expect(result).deep.eq([
            { value: 'hello', type: 'content' },
            { type: 'node', mode: 'one', name: 'var1' },
        ]);
        result = parseLikeClause('hello[[$var1]]world');
        expect(result).deep.eq([
            { value: 'hello', type: 'content' },
            { type: 'node', mode: 'one', name: 'var1' },
            { value: 'world', type: 'content' },
        ]);
        result = parseLikeClause('[[$var1:*=a]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var1', match: { operator: '*', value: 'a' } }]);
        result = parseLikeClause('[[$var1:^=a]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var1', match: { operator: '^', value: 'a' } }]);
        result = parseLikeClause('[[$var1:$=a]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var1', match: { operator: '$', value: 'a' } }]);
        result = parseLikeClause('[[$var1]][[$var2]]');
        expect(result).deep.eq([
            { type: 'node', mode: 'one', name: 'var1' },
            { type: 'node', mode: 'one', name: 'var2' },
        ]);
        result = parseLikeClause('1[[$var1]]2[[$var2]]3');
        expect(result).deep.eq([
            { value: '1', type: 'content' },
            { type: 'node', mode: 'one', name: 'var1' },
            { value: '2', type: 'content' },
            { type: 'node', mode: 'one', name: 'var2' },
            { value: '3', type: 'content' },
        ]);

        result = parseLikeClause('hello{[[{]]sub content [[}]]}world');
        expect(result).deep.eq([
            { value: 'hello{', type: 'content' },
            { type: 'scope', value: [{ value: 'sub content', type: 'content' }], exactEnd: false, exactStart: false },
            { value: '}world', type: 'content' },
        ]);
        result = parseLikeClause('[[$var1]][[{]]sub content [[$subVar1]][[}]][[$var2]]');
        expect(result).deep.eq([
            { type: 'node', mode: 'one', name: 'var1' },
            {
                type: 'scope',
                value: [
                    { value: 'sub content', type: 'content' },
                    { type: 'node', mode: 'one', name: 'subVar1' },
                ],
                exactEnd: false,
                exactStart: false,
            },
            { type: 'node', mode: 'one', name: 'var2' },
        ]);
    });
    it('变量可选', () => {
        const result = parseLikeClause('[[$var1?]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', optional: true, name: 'var1' }]);
    });
    it('正则表达式匹配', () => {
        let result = parseLikeClause('[[$var1:/abc/]]');
        expect(result).deep.eq([
            {
                type: 'node',
                mode: 'one',
                name: 'var1',
                match: { value: { pattern: 'abc', flags: undefined }, operator: 'regexp' },
            },
        ]);
        result = parseLikeClause('[[$var1:/abc/gi]]');
        expect(result).deep.eq([
            { type: 'node', mode: 'one', name: 'var1', match: { value: { pattern: 'abc', flags: 'gi' }, operator: 'regexp' } },
        ]);
    });
    it('多行匹配', () => {
        const result = parseLikeClause(`hello
     [[{]]world[[}]]  
            outside`);
        expect(result).deep.eq([
            { value: 'hello', type: 'content' },
            { type: 'scope', value: [{ value: 'world', type: 'content' }], exactEnd: false, exactStart: false },
            { value: 'outside', type: 'content' },
        ]);
    });
    // 已经恢复,因为会影响匹配结果
    it.skip('优化:去掉第一个为可选匹配', () => {
        const result = parseLikeClause('[[?]][[?]][[?]]');
        expect(result).deep.eq([]);
    });
    it('优化:搜索域为第一个时候去掉', () => {
        const result = parseLikeClause('[[{]]hello[[{]]world[[}]][[}]]');
        expect(result).deep.eq([
            { value: 'hello', type: 'content' },
            { type: 'scope', value: [{ value: 'world', type: 'content' }], exactEnd: false, exactStart: false },
        ]);
    });
    // 恢复,因为去掉的话会影响匹配结果
    it('第一个是[[?]]', () => {
        const result = parseLikeClause('[[?]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', optional: true }]);
    });
    it('匹配任意一个', () => {
        const result = parseLikeClause('[[.]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', optional: false }]);
    });
    it('进入模糊匹配', () => {
        const result = parseLikeClause('let[[...]]=1');
        expect(result).deep.eq([
            { value: 'let', type: 'content' },
            {
                type: 'next-fuzzy',
            },
            { value: '=1', type: 'content', fuzzy: true },
        ]);
    });
    it('等于', () => {
        const result = parseLikeClause('[[$var:=abc]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var', match: { operator: '=', value: 'abc' } }]);
    });
    it('不等于', () => {
        const result = parseLikeClause('[[$var:!=abc]]');
        expect(result).deep.eq([{ type: 'node', mode: 'one', name: 'var', match: { operator: '!', value: 'abc' } }]);
    });
    it('$+', () => {
        const result = parseLikeClause('[[$+var]]');
        expect(result).deep.eq([{ type: 'node', mode: 'append', name: 'var' }]);
    });
});
