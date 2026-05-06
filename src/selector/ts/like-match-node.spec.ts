import { createCssSelectorForTs } from './css-selector-for-ts';
import ts from 'typescript';
import { expect } from 'chai';
import { LikeMatch } from '../base/like-match-node';
import { parseLikeClause } from '../base/like';
import { readFileSync } from 'fs';
import path from 'path';
function createSourceFile(content: string, name = '') {
    return ts.createSourceFile(name, content, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
}
describe('测试内容匹配', () => {
    it('start', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let a = [[$var1]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['var1']).to.be.ok;
    });
    // todo 需要进行scope同级限制
    it('搜索域测试', () => {
        const s = createCssSelectorForTs(
            createSourceFile(readFileSync(path.join(process.cwd(), './test/fixture/a.ts'), { encoding: 'utf-8' }))
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause('class [[$var1]] { [[{]] subVar2:[[$var2]] [[}]] }');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0].children[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],

                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(2);
        for (const item of result) {
            expect(item.infer['var1']).to.be.ok;
            expect(item.infer['var2']).to.be.ok;
            expect((item.infer['var2'] as any).value).to.eq('string');
            expect(item.pathList[item.pathList.length - 1].value).eq('}');
        }
        expect((result[0].infer['var1'] as any).value).to.eq('L1');
        expect((result[1].infer['var1'] as any).value).to.eq('L2');
    });
    it('可选匹配', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let [[?]] =6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0].children[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],

                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.length).to.eq(4);
    });
    it('正则匹配', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let [[$var1:/a/]] =6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0].children[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],

                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['var1']).to.be.ok;
    });
    it('非起点搜索', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a =6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('记忆化搜索', () => {
        const s = createCssSelectorForTs(
            createSourceFile(readFileSync(path.join(process.cwd(), './test/fixture/memory-search.ts'), { encoding: 'utf-8' }))
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`constructor()[[?]]
            [[{]]
                console
            [[}]]
        }`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0].children[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],

                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('非起点模糊搜索', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6\nlet b=1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[?]]b =1');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.length).to.eq(4);
    });
    it('限制匹配', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6\nlet b=1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[$var1:/^\\w$/]]');
        const likeMatch = new LikeMatch();
        let result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { count: 2 }
        );
        expect(result.length).to.eq(2);
        expect((result[0].infer['var1'] as any).value).to.eq('a');
        expect((result[1].infer['var1'] as any).value).to.eq('b');
        result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { count: 1 }
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer['var1'] as any).value).to.eq('a');
    });
    it('划分字符串(目前暂时认为ww必须匹配完全)', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6;let leta=1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('leta');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { count: 2 }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList[0].value).to.eq('leta');
    });
    it('匹配任意一个', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[.]]=6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { count: 2 }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList[1].value).to.eq('a');
    });
    it('触发模糊匹配', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[...]]6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { count: 2 }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList[1].value).to.eq('6');
    });
    it('匹配层级', () => {
        const s = createCssSelectorForTs(createSourceFile("const b='';let a=6"));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let [[$var]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            {
                matchLevel: 'bottom',
            }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList[1].value).to.eq('a');
    });
    it('selector like bottom', () => {
        const s = createCssSelectorForTs(createSourceFile("const b='';let a=6"));
        let result = s.queryOne('SourceFile:like(let [[$var]])', { matchLevel: 'bottom' });
        expect((result.infer.var as any).value).eq('a');
        result = s.queryOne('SourceFile:like(let [[$var]])', { matchLevel: 'top' });
        expect((result.infer.var as any).value).eq('a=6');
    });
    it('区域内模糊搜索', () => {
        const s = createCssSelectorForTs(createSourceFile('function abc(p1,p2,p3){abc(1,2,3)}'));
        const result = s.match(`function abc(
            [[{]]
                [[$p1]],[[...]],[[$p3]]
            [[}]]
                )`);
        expect(result.length).eq(1);
        expect(result[0].infer.p1).ok;
        expect((result[0].infer.p1 as any).value).eq('p1');
        expect(result[0].infer.p3).ok;
        expect((result[0].infer.p3 as any).value).eq('p3');
    });
    it('区域内精准搜索', () => {
        const s = createCssSelectorForTs(createSourceFile('function abc(p1,p2,p3,p4){abc(1,2,3,4)}'));
        const result = s.match(`function abc(
            [[{^]]
                [[$p1]][[...]],[[$p4]]
            [[$}]]
                )`);
        expect(result.length).eq(1);
        expect(result[0].infer.p1).ok;
        expect((result[0].infer.p1 as any).value).eq('p1');
        expect(result[0].infer.p4).ok;
        expect((result[0].infer.p4 as any).value).eq('p4');
    });
    it('区域内精准搜索-区域内是模糊', () => {
        const s = createCssSelectorForTs(createSourceFile('abc(1,2,3,4)'));
        // p4是模糊的,那么p4就会有多个,但是p4中可能的是1,2,3,4顶级节点,bottom后1/,/2/,/3/,/4 1优先就有问题了
        // 因为scope匹配1成功,所以直接关闭整个搜索,但是后面的却失败了.所以不行

        const result = s.match(`abc( [[{]][[...]][[$p4]] [[$}]] )`);
        expect(result.length).eq(1);

        expect(result[0].infer.p4).ok;
        expect((result[0].infer.p4 as any).value).eq('4');
    });
    it('区域内精确模糊搜索(进行模糊搜索后,其实应该进行genList分布判断)', () => {
        const s = createCssSelectorForTs(createSourceFile(`test1(1, 2, 3, 4)`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`test1( 
                [[{^]]
                  [[$p1]][[...]][[$p4]]
                [[$}]]
                  )`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            {
                matchLevel: 'bottom',
            }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.map((item) => item.value).join('')).to.eq('test1(14)');
    });
    // 模糊搜索搜索不到时不应该异常
    it('区域内模糊搜索失败', () => {
        const s = createCssSelectorForTs(createSourceFile('function abc(p1,p2,p3){abc(1,2,3)}'));
        const result = s.match(`function abc(
            [[{]]
                [[$p1]],[[...]],[[$p3]]
                [[}]]
                x`);
        expect(result.length).eq(0);
    });
    it('scope右侧不是content而是node', () => {
        const s = createCssSelectorForTs(createSourceFile('test1(1, 2, 3, 4);'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`test1(
             [[{]][[$p1]]   [[}]]
             [[$br]];`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            {
                matchLevel: 'bottom',
            }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.map((item) => item.value).join('')).to.eq('test1(1);');
        expect((result[0].infer.br as any).value).to.eq(')');
    });
    it('空scope', () => {
        const s = createCssSelectorForTs(createSourceFile('test1(1, 2, 3, 4);'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('test1([[{]][[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            {
                matchLevel: 'bottom',
            }
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.map((item) => item.value).join('')).to.eq('test1()');
    });
    it('使用生成器下匹配一次,调用一次', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=1;let a=1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            {
                matchLevel: 'bottom',
                count: 1,
            }
        );
        expect(result.length).to.eq(1);
    });

    it('区域测试', () => {
        const s = createCssSelectorForTs(createSourceFile('abc(1,2)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('abc([[{]] [[$p1]] [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer['p1'] as any).value).eq('1');
    });
    // todo 补充用例

    it('纯content', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let a=1');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('纯变量', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[$var]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        // 因为默认Bottom所以一定找到第一个
        // 默认传入的是一个顶层,所以会搜索到第一个底层
        // todo 理论上所有底层都应该是可匹配的
        expect((result[0].infer.var as any).value).eq('let');
    });
    it('空区域', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[{]][[}]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(0);
    });
    it('scope匹配(会提升)', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[{]]let[[}]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList[0].value).to.eq('let');
    });
    it('content-node', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[$var]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('a');
    });
    it('node-content', () => {
        const s = createCssSelectorForTs(createSourceFile('let a = 1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[$var]]a');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('let');
    });
    it('content scope(node)', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] [[$var]] [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('1');
    });
    it('content scope(content)', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] 1 [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('content ... content', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[...]]6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.length).to.eq(2);
        expect(result[0].pathList[0].value).to.eq('let');
        expect(result[0].pathList[1].value).to.eq('6');
    });
    it('content ... node', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let[[...]][[$var]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('a');
    });
    it('content ... node 多', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let a[[...]][[$var]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        // 因为a=6在第一层的时候被认为一个,所以就是模糊匹配只匹配一个,这个是第一层分两个节点
        expect(result.length).to.eq(2);
    });
    it('scope:...content', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] [[...]] 2 [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('scope:...node', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] [[...]] [[$var]] [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('1');
    });
    it('scope:...node 带验证', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] [[...]] [[$var:/2/]] [[}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('2');
    });
    it('scope:...node$', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{]] [[...]] [[$var]] [[$}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('3');
    });
    it('scope:^node...', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{^]][[$var]] [[...]]  [[$}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('1,2,3');
    });
    it('scope:^node...content', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{^]][[$var]] [[...]]  3[[$}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('1');
    });
    it('scope:^node...content$ 无', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{^]][[$var]] [[...]]  2[[$}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(0);
    });
    it('scope:...', () => {
        const s = createCssSelectorForTs(createSourceFile('a(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a([[{^]] [[...]] [[$}]])');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('=', () => {
        const s = createCssSelectorForTs(createSourceFile('abc(1,2,3)'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[$var:=abc]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('abc');
    });
    it('转义', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=[[ 1 ] ]'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('\\[[1]]');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
    });
    it('不等于', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=1;let b=1'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('let [[$var:!=a]] =');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).value).to.eq('b');
    });
    it('content多查询混淆', () => {
        const s = createCssSelectorForTs(
            createSourceFile(`let a;
        a = a = a = a;`)
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause('a=a');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(3);
    });
    it('content:大文件搜索测试', () => {
        let a = Date.now();
        const s = createCssSelectorForTs(
            createSourceFile(readFileSync(path.join(process.cwd(), 'test/fixture/big-like.ts'), { encoding: 'utf-8' }))
        );
        console.log(Date.now() - a);
        const tree = s.getAstTree().children;
        console.log(Date.now() - a);

        const list = parseLikeClause('class FormControl');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        console.log(Date.now() - a);
        expect(result.length).eq(1);
    });
    it.skip('?content:大文件搜索测试', () => {
        // todo 需要反向优化
        let a = Date.now();
        const s = createCssSelectorForTs(
            createSourceFile(readFileSync(path.join(process.cwd(), 'test/fixture/big-like.ts'), { encoding: 'utf-8' }))
        );
        console.log(Date.now() - a);
        const tree = s.getAstTree().children;
        console.log(Date.now() - a);

        const list = parseLikeClause('[[$var]] class FormControl');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        console.log(Date.now() - a);
        expect(result.length).eq(1);
        expect(result[0].pathList[0].value).eq('export');
    });
    it('优化:锚定搜索', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const tree = s.getAstTree().children;
        const list = parseLikeClause('[[$var]] [[$name]] = 6');
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['var']).to.be.ok;
    });
    it('多搜索域嵌套', () => {
        const s = createCssSelectorForTs(
            createSourceFile(`console.log('one')
        function abc() {
            console.log('two');
            function bcd() {
                console.log('three');
            }
        }
        `)
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`function abc(){
            [[{]]
function bcd(){
    [[{]]
    console.log([[$log]])
    [[}]]
}
            [[}]]
        }`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['log']).to.be.ok;
        expect((result[0].infer['log'] as any).value).eq(`'three'`);
    });
    it('优化: bottom 查询', () => {
        const s = createCssSelectorForTs(
            createSourceFile(`@DDD()
            class ABC{}`)
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`[[$var]]class ABC`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['var']).to.be.ok;
        expect((result[0].infer['var'] as any).value).eq(`)`);
    });
    it('优化: top 查询', () => {
        const s = createCssSelectorForTs(
            createSourceFile(`@DDD()
            class ABC{}`)
        );
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`[[$var]]class ABC`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            })),
            { matchLevel: 'top' }
        );
        expect(result.length).to.eq(1);
        expect(result[0].infer['var']).to.be.ok;
        expect((result[0].infer['var'] as any).value).eq(`@DDD()`);
    });
    it('?可选', () => {
        const s = createCssSelectorForTs(createSourceFile(`const a=1`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`[[?]]const a=1`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.length).to.eq(2);
    });
    it('可选?', () => {
        const s = createCssSelectorForTs(createSourceFile(`const a=1`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`const a=1[[?]]`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect(result[0].pathList.length).to.eq(2);
    });
    it('.为空', () => {
        const s = createCssSelectorForTs(createSourceFile(`const a=1`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`[[.]]const a=1`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(0);
    });
    it('为空.', () => {
        const s = createCssSelectorForTs(createSourceFile(`const a=1`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`const a=1[[.]]`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(0);
    });

    it('列表', () => {
        const s = createCssSelectorForTs(createSourceFile(`let a=1;let b=1`));
        const tree = s.getAstTree().children;
        const list = parseLikeClause(`let [[$+var]] [[...]] let [[$+var]]`);
        const likeMatch = new LikeMatch();
        const result = likeMatch.match(
            list,
            [tree[0]].map((item) => ({
                data: item,
                infer: {},
                start: item.range[0],
                end: item.range[1],
            }))
        );
        expect(result.length).to.eq(1);
        expect((result[0].infer.var as any).length).to.eq(2);
        expect((result[0].infer.var as any[]).map((item) => item.value)).deep.eq(['a', 'b']);
    });
});
