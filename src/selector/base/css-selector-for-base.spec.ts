import { BaseOptions, CssSelectorBase, Selector } from './css-selector-base';
import { parse } from 'css-what';
import { ASTViewNode, ExtraDataItem, ExtraDataLiteralItem, NodeRange } from './type';
import { expect } from 'chai';
interface MockNode {
    attrs?: { [name: string]: { value: string } };
    tag: string;
    children?: MockNode[];
    parent?: MockNode;
    start?: number;
    end?: number;
}
class MockCssSelector extends CssSelectorBase<MockNode> {
    protected content = '';
    constructor(public rootNodeList: MockNode[], options?: BaseOptions) {
        super(options);
    }
    findTagName(node: MockNode) {
        return node.tag;
    }
    getChildren(node: MockNode) {
        return node.children || [];
    }

    override getNodePosition(node: MockNode): NodeRange {
        return [node.start!, node.end!];
    }
    protected override getNodeExtraData(
        node: MockNode,
        callPath: string,
        registryMap: Map<string, () => any>
    ): Record<string, ExtraDataItem> {
        const record = super.getNodeExtraData(node, callPath, registryMap);

        for (const item of Object.entries(node.attrs || {})) {
            record[item[0]] = new ExtraDataLiteralItem(item[1].value);
        }
        return record;
    }
}

const mockNode: MockNode = {
    tag: '__root',
    children: [
        { tag: 'div', attrs: { class: { value: 'test' }, id: { value: 'mock' } }, children: [{ tag: 'p', children: [{ tag: 'code' }] }] },
        { tag: 'span' },
        { tag: 'test-class', attrs: { class: { value: 'one' }, lang: { value: 'zh-cn' } } },
        { tag: 'two-class', attrs: { class: { value: 'one two' } } },
        { tag: 'div' },
    ],
};
const mockNode2: MockNode = {
    tag: '__root',
    children: [
        {
            tag: 'div',
            attrs: {},
            children: [
                { tag: 'sub1', children: [] },
                { tag: 'sub2', children: [{ tag: 'code' }] },
            ],
        },
    ],
};
const mockNode3: MockNode = {
    tag: '__root',
    children: [
        { tag: 'div', attrs: { id: { value: '1' } } },
        { tag: 'div', attrs: { id: { value: '2' } } },
    ],
};
const isMockNode: MockNode = {
    tag: '__root',
    start: 0,
    end: 999,
    children: [
        {
            tag: 'node1',
            attrs: {},
            children: [{ tag: 'p', children: [{ tag: 'sub-node', start: 0, end: 10 }], start: 0, end: 25 }],
            start: 0,
            end: 50,
        },
        {
            tag: 'node2',
            attrs: {},
            children: [{ tag: 'p', children: [{ tag: 'sub-node', start: 51, end: 60 }], start: 51, end: 100 }],
            start: 51,
            end: 999,
        },
    ],
};
const topTestNodeList: MockNode[] = [{ tag: 'div' }, { tag: 'span' }];
const parent: MockNode = { tag: 'parent', attrs: {} };
const child = { tag: 'p', parent: parent };
parent.children = [child];
const parentQuery: MockNode = {
    tag: '__root',
    children: [parent],
};

describe('通用节点', () => {
    const selector = new MockCssSelector([mockNode], {});
    it('初始化', () => {
        expect(selector).to.be.ok;
    });
    it('标签查询', () => {
        const result = selector.queryAll('div');
        expect(result[0] instanceof ASTViewNode).to.be.ok;
        expect(result.length).to.eq(2);
    });
    it('~', () => {
        const result = selector.queryAll('div~span');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'span').to.be.true;
    });
    it('>', () => {
        let result = selector.queryAll('div>p');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'p').to.be.true;
        result = selector.queryAll(`div
        >
        p`);
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'p').to.be.true;
    });
    it(',', () => {
        const result = selector.queryAll('div,span');

        expect(result.length).to.eq(3);
    });
    it('attribute equal', () => {
        const result = selector.queryAll('div[id=mock]') as any as ASTViewNode<MockNode>[];
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context?.node.attrs!['id']).to.be.ok;
        expect(result[0].context?.node.attrs!['id'].value == 'mock').to.be.ok;
    });
    it('attribute exist', () => {
        const result = selector.queryAll('div[id]') as any as ASTViewNode<MockNode>[];
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context?.node.attrs!['id']).to.be.ok;
    });
    it('attribute any', () => {
        const result = selector.queryAll('div[id*=mo]') as any as ASTViewNode<MockNode>[];
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context?.node.attrs!['id']).to.be.ok;
        expect(result[0].context?.node.attrs!['id'].value == 'mock').to.be.ok;
    });

    it('a b c', () => {
        const result = selector.queryAll('div  p code');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'code').to.be.ok;
    });

    it('*', () => {
        // 目前修改为从所有节点开始搜索,而不是新建一个根
        expect(selector.queryAll('*').length).to.eq(8);
        expect(selector.queryAll('div *').length).to.eq(2);
        const pChildren = selector.queryAll('p *');
        expect(pChildren.length).to.eq(1);
        expect(pChildren[0].tag).to.eq('code');
    });
    it('指定节点为undefined时选择,直接返回', () => {
        let result = selector.queryOne('not-a-label');
        expect(result).to.be.not.ok;
        result = selector.queryOne(result, 'div');
        expect(result).to.be.not.ok;
    });
    it('attribute $=', () => {
        //mock
        let result = selector.queryOne('[id$=ck]');
        expect(result).to.be.ok;
        result = selector.queryOne('[id$=mo]');
        expect(result).to.be.not.ok;
    });
    it('attribute ^=', () => {
        let result = selector.queryOne('[id^=mo]');
        expect(result).to.be.ok;
        result = selector.queryOne('[id^=ck]');
        expect(result).to.be.not.ok;
    });
    it('attribute |=', () => {
        let result = selector.queryOne('[lang|=zh]');
        expect(result).to.be.ok;

        result = selector.queryOne('[class|=zh-cn]');
        expect(result).to.be.not.ok;
    });
    it('attribute ~=', () => {
        let result = selector.queryOne('[class~=one]');
        expect(result).to.be.ok;
        result = selector.queryOne('[class~=two]');
        expect(result).to.be.ok;
        result = selector.queryOne('[class~=no-class]');
        expect(result).to.be.not.ok;
    });
    it('attribute !=', () => {
        let result = selector.queryOne('[class!=one]');
        expect(result).to.be.ok;
        result = selector.queryOne('[class!="one two"][class!=one][class!=test]');
        expect(result).to.be.not.ok;
    });
    it('attribute default', () => {
        const result = selector.queryOne('[class~=one]');
        expect(result).to.be.ok;
    });

    it('default', () => {
        try {
            selector.queryOne('div:xxx');
        } catch (error) {
            return expect(error).to.be.ok;
        }
        throw new Error('');
    });

    it(':has', () => {
        let result = selector.queryAll('div:has(p)');
        expect(result.length).to.eq(1);
        result = selector.queryAll('div:has(+span)');
        expect(result.length).to.eq(1);
        result = selector.queryAll('div:has(div)');
        expect(result.length).to.eq(0);
    });
    it(':not', () => {
        let result = selector.queryAll('div:not([class=test])');
        expect(result.length).to.eq(1);
        result = selector.queryAll('div:not([class=notaclass])');
        expect(result.length).to.eq(2);
        result = selector.queryAll('div');
        expect(result.length).to.eq(2);
    });
    it(':is/:where', () => {
        const selector = new MockCssSelector([isMockNode], {});
        let result = selector.queryAll(':is(node1,node2) sub-node');
        expect(result.length).to.eq(2);
        result = selector.queryAll('node1 :is(sub-node)');
        expect(result.length).to.eq(1);
        result = selector.queryAll('node1 :is(no-node)');
        expect(result.length).to.eq(0);
    });
    // it('::element', () => {
    //     let result = selector.queryAll(`div::p`);
    //     expect(result.length).to.eq(1);
    //     expect(result[0].tag).to.eq('p');
    //     result = selector.queryAll(`div::p code`);
    //     expect(result.length).to.eq(1);
    //     expect(result[0].tag).to.eq('code');
    // });
    it('反向查询修复', () => {
        const selector = new MockCssSelector([parentQuery], {});
        const result = selector.queryOne('p');
        const result2 = selector.queryOne(result, '<parent');
        expect(result2).to.be.ok;
        expect(result2.tag).to.eq('parent');
    });
    it('定位', () => {
        const selector = new MockCssSelector([isMockNode], {});
        let result = selector.locate([0, 10]);
        expect(result.length).to.eq(4);
        result = selector.locate([51, 61]);
        expect(result[0].node instanceof ASTViewNode).to.be.true;
        expect(result.length).to.eq(3);
    });
    it('tag', () => {
        //div p
        const result = selector.queryAll('[tag=div] [tag=p]');
        expect(result.length).to.eq(1);
    });
    it('使用子元素定位父元素', () => {
        const result = selector.queryOne('[tag=div]:has(>[tag=p])');
        expect(result.tag).to.eq('div');
    });
    it(':first-child/:last-child', () => {
        let result = selector.queryAll('div:first-child');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.be.above(0);
        result = selector.queryAll('div:last-child');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.eq(0);
    });
    it(':only-child', () => {
        let result = selector.queryAll('two-class:only-child');
        expect(result.length).to.eq(0);
        result = selector.queryAll('code:only-child');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'code').to.be.true;
    });
    it(':nth-child', () => {
        let result = selector.queryAll('div:nth-child(0n + 1)');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.be.above(0);
        result = selector.queryAll('span:nth-child(0n + 2)');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'span').to.be.ok;
        result = selector.queryAll('div:nth-child(1n)');
        expect(result.length).to.eq(2);
    });
    it(':nth-last-child', () => {
        let result = selector.queryAll('two-class:nth-last-child(0n + 2)');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'two-class').to.be.true;
        result = selector.queryAll('div:nth-last-child(0n + 1)');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.eq(0);
    });
    it(':nth-last-of-type', () => {
        const result = selector.queryAll('div:nth-last-of-type(0n + 2)');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.be.above(0);
    });
    it(':nth-of-type', () => {
        const result = selector.queryAll('div:nth-of-type(0n + 1)');
        expect(result.length).to.eq(1);
        expect(result[0].children.length).to.be.above(0);
    });
    it(':only-of-type', () => {
        let result = selector.queryAll('two-class:only-of-type');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'two-class').to.be.true;
        result = selector.queryAll('two-class:only-of-type');
    });
    it('通用下读取ast', () => {
        const selector = new MockCssSelector([isMockNode], {});
        const root = selector.getAstTree(selector.rootNodeList, true);
        expect(root).to.be.ok;
    });
    it('伪元素::children', () => {
        const selector = new MockCssSelector([isMockNode], {});

        const result = selector.queryAll('node1::children(0)');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('p');
    });
    it('伪元素::children-负数索引', () => {
        const selector = new MockCssSelector([isMockNode], {});
        let result = selector.queryAll('__root::children(-1)');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('node2');
        result = selector.queryAll('__root::children(1)');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('node2');
        result = selector.queryAll('__root::children(0)');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('node1');
    });
    it('伪元素::parent', () => {
        const selector = new MockCssSelector([isMockNode], {});

        const result = selector.queryAll('p::parent');
        expect(result.length).to.eq(2);
        expect(result[0].tag).to.eq('node1');
        expect(result[1].tag).to.eq('node2');
    });
    it(':raw', () => {
        const selector = new MockCssSelector([isMockNode], {});
        const result = selector.queryAll('p:raw([start=0])');
        expect(result.length).to.eq(1);
    });
    it('node-json', () => {
        const result = selector.queryOne('div');
        const data = JSON.stringify(result);
        expect(data).to.be.ok;
    });
    it('查询重复', () => {
        const result = selector.queryAll('div>p>code,div>p>code');
        expect(result.length).to.eq(1);
    });
    it('回车解析', () => {
        /** 伪类,伪元素之类的不能分离,其他的可以 */
        let result = parse(`div
>
div`);
        result;
        expect(result[0].length).to.eq(3);
        result = parse(`div
   >
   div`);
        expect(result[0].length).to.eq(3);
        result = parse('div:has(div)');
        expect(result[0].length).to.eq(2);
        expect((result[0][1] as any).data[0].length).to.eq(1);
        result = parse(`div:has(
               div)`);
        expect(result[0].length).to.eq(2);
        expect((result[0][1] as any).data[0].length).to.eq(1);
    });
    it(':use', () => {
        const selector = new MockCssSelector([isMockNode], {});
        const result = selector.queryAll('node1:use(*,*>p)');
        const result2 = selector.queryAll('node1:is(*,*>p)');
        expect(result2.length).to.eq(1);
        expect(result.length).to.eq(2);
        expect(result[0].tag).to.eq('node1');
        expect(result[1].tag).to.eq('p');
    });
    it('二次查询', () => {
        let result = selector.queryOne('div');
        result = selector.queryOne(result, 'p');
        expect(result).to.be.ok;
        expect(result.tag).to.eq('p');
    });
    it('序列化', () => {
        const result = selector.queryOne('div');
        const data = JSON.parse(JSON.stringify(result));
        expect(data.children[0]).to.be.not.ok;
        expect(data.extra).to.be.not.ok;
        let tree = selector.getAstTree(undefined, undefined, { toJsonWithChildren: true, toJsonWithExtra: true });
        expect(tree.children[0].extra.tag).to.be.ok;
        let data2 = JSON.parse(JSON.stringify(tree));
        expect(data2.children[0].extra.tag).to.be.ok;
        expect(data2.children[0].children[0]).to.be.ok;
        tree = selector.getAstTree(undefined, undefined, { toJsonWithChildren: false });
        expect(tree.children[0].children[0]).to.be.ok;
        data2 = JSON.parse(JSON.stringify(tree));
        expect(data2.children[0].children[0]).to.be.not.ok;
    });
    it(':not 直接作为子级', () => {
        const selector = new MockCssSelector([mockNode2], {});

        const result = selector.queryAll('div :not([tag=sub1])');
        expect(result.length).to.eq(2);
        expect(result[0].tag !== 'sub1').to.be.true;
        expect(result[1].tag !== 'sub1').to.be.true;
    });
    it(':has 直接作为子级', () => {
        const selector = new MockCssSelector([mockNode2], {});
        const result = selector.queryAll('div :has([tag=code])');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'sub2').to.be.true;
    });
    it('函数过滤', () => {
        const selector = new MockCssSelector([mockNode3], {});
        const result = selector.queryAll('div:each(test1)', {
            eachFunction: {
                test1: (node) => node.extra['id'].value === '1',
            },
        });
        expect(result.length).to.eq(1);
        expect(result[0].extra['id'].value === '1').to.be.true;
    });
    it('模板函数自动', () => {
        const selector = new MockCssSelector([mockNode3], {});
        const result = selector.queryAll(Selector`div:each(${(node) => node.extra['id'].value === '1'})`);
        expect(result.length).to.eq(1);
        expect(result[0].extra['id'].value === '1').to.be.true;
    });
    it('infer', () => {
        let selector = new MockCssSelector([mockNode], {});
        let result = selector.queryAll(Selector`div:has(p:infer(subNode))`);
        expect(result.length).to.eq(1);
        expect(result[0].infer!['subNode']).to.be.ok;
        expect((result[0].infer!['subNode'] as ASTViewNode<any>).tag).to.eq('p');
        selector = new MockCssSelector([mockNode3], {});
        result = selector.queryAll(Selector`div:is([id=1]:infer(subNode))`);
        expect(result.length).to.eq(1);
        expect(result[0].infer!['subNode']).to.be.ok;
        expect((result[0].infer!['subNode'] as ASTViewNode<any>).tag).to.eq('div');
    });
    it('顶级父节点测试', () => {
        const selector = new MockCssSelector(topTestNodeList, {});
        const result = selector.queryAll('div+span');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('span');
    });
    it.skip('&?? 不支持', () => {
        const selector = new MockCssSelector(topTestNodeList, {});
        const result = selector.queryAll('&:like(div)');
    });
});
