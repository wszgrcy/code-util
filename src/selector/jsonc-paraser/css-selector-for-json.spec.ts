import { expect } from 'chai';
import { createCssSelectorForJson } from './css-selector-for-json';
const mockJsonString = '{"p1":1,"p2":"2","p3":{"p31":{"p32":"value32","p31":"strp32"}}}';
function createSelector(str: string = mockJsonString) {
    return createCssSelectorForJson(str);
}
// todo 由于改变了选择方式,所以原来的测试都废弃,
xdescribe('用于json的css选择器', () => {
    it('初始化', () => {
        const jsonSelector = createCssSelectorForJson('{"name":1}');
        expect(jsonSelector).to.be.ok;
    });
    it('默认', () => {
        const selector = createSelector('{"name":1}');
        const result = selector.queryOne('name');
        expect(result.children![0].value).to.eq('name');
        expect(result.children![1].children.length).to.eq(1);
    });
    it('~', () => {
        const cssSelctor = createSelector();
        const result = cssSelctor.queryAll('p1~p3');

        expect(result.length).to.eq(1);
        expect(result[0].children![0].value).to.eq('p3');
        expect(result[0].children![1].type).to.eq('object');
    });
    it('>', () => {
        const cssSelctor = createSelector();
        const result = cssSelctor.queryAll('p3>p31');

        expect(result.length).to.eq(1);
        expect(result[0].children![0].value).to.eq('p31');
        expect(result[0].children![1].type).to.eq('object');
        expect(result[0].children![1].value).not.to.eq('strp32');
        // expect(result[0].name === 'p').to.be.true;
    });
    it(',', () => {
        const cssSelctor = createSelector();
        const result = cssSelctor.queryAll('p1,p3');

        expect(result.length).to.eq(2);
    });
    it('attribute equal', () => {
        const selector = createSelector('{"name":1}');
        const result = selector.queryOne('name[value=1][type=number]');
        expect(result.children![0].value).to.eq('name');
        expect(result.children![1].children.length).to.eq(1);
    });
    it('attribute any', () => {
        const selector = createSelector();
        const result = selector.queryAll('[value*=32]');
        expect(result.length).to.eq(2);
    });
    it('a b c', () => {
        const selector = createSelector();
        const result = selector.queryAll('p3 p31 p32');
        expect(result.length).to.eq(1);
    });
    it('通过返回的node进行查询', () => {
        const selector = createSelector();
        let result = selector.queryOne('p3');
        result = selector.queryOne(result, 'p31 p32');
        expect(result).to.be.ok;
    });
    it('解析失败抛出异常', () => {
        try {
            createCssSelectorForJson('{a:1}');
        } catch (error) {
            return expect(error).to.be.ok;
        }
        throw new Error('');
    });
    it('定位', () => {
        const jsonSelector = createCssSelectorForJson('{"name":1}');
        const result = jsonSelector.locate([2, 2]);
        expect(result.length).to.eq(2);
    });
    it('extra没有children/parent', () => {
        const jsonSelector = createCssSelectorForJson('{"n1":{"n2":1}}');
        const result = jsonSelector.getAstTree(jsonSelector.rootNodeList, true);
        const childrenProperty = result.children[0].extra['children'];
        expect(childrenProperty).to.be.not.ok;
        const parentProperty = result.children[0].children[0].extra['parent'];
        expect(parentProperty).to.be.not.ok;
    });
    describe('通用查询', () => {
        it('子节点是数组', () => {
            const jsonSelector = createCssSelectorForJson(
                `{
            "list":[1,2,3]
                }`,
                {}
            );
            const result = jsonSelector.queryAll('string[value*=list]<*');
            expect(result.length).to.eq(1);
            expect(result[0].tag === 'property').to.be.true;
        });
        it('cjson读取失败', () => {
            const s = createCssSelectorForJson(
                `{
                "include": [
                    "",
                ]
            }
            `,
                {}
            );
        });
        it('读取不带引号的', () => {
            const s = createCssSelectorForJson('{"value":1}', {});
            const res = s.queryOne('[value=value]');
            expect(res).to.be.ok;
        });
    });
});
