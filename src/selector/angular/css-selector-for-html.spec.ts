import { expect } from 'chai';
import { loadEsmModule } from '../../util';

import { createCssSelectorForHtml } from './css-selector-for-html';

const mockHtml = `<div class="test" id="mock">
<p>123<code></code>  </p>
</div><span></span>`;
describe('用于ts node的css选择器', () => {
    it('初始化', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        expect(cssSelector).to.be.ok;
    });
    it('标签查询', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });

        const result = cssSelector.queryAll('div');
        // console.log(result)
        expect(result.length).to.eq(1);
    });
    it('~', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('div~span');

        expect(result.length).to.eq(1);
        expect(result[0].tag === 'span').to.be.true;
    });
    it('>', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('div>p');

        expect(result.length).to.eq(1);
        expect(result[0].tag === 'p').to.be.true;
    });
    it(',', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('div,span');

        expect(result.length).to.eq(2);
    });
    it('attribute equal', async () => {
        const cssSelctor = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelctor.queryAll('div[id=mock]');

        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context!.node.attrs.find((item) => item.name == 'id' && item.value == 'mock')).to.be.ok;
    });
    it('attribute exist', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('div[id]');

        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context!.node.attrs.find((item) => item.name == 'id')).to.be.ok;
    });
    it('attribute any', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('div[id*=mo]');

        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context!.node.attrs.find((item) => item.name == 'id' && item.value == 'mock')).to.be.ok;
    });
    it('.class', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('div[class=test]');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context!.node.attrs.find((item) => item.value == 'test')).to.be.ok;
    });
    it('#id', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[id=mock]');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'div').to.be.ok;
        expect(result[0].context!.node.attrs.find((item) => item.value == 'test')).to.be.ok;
    });
    it('通过返回的element进行查询', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        let result = cssSelector.queryAll('div[class=test]');
        expect(result.length).to.eq(1);
        result = cssSelector.queryAll(result[0], 'p');
        expect(result.length).to.eq(1);
        expect(result[0].tag).to.eq('p');
    });
    it('a b c', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('div  p code');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'code').to.be.ok;
    });
    it('复杂选择', async () => {
        const cssSelector = await createCssSelectorForHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('div[id=mock][class=test] p');
        expect(result.length).to.eq(1);
        expect(result[0].tag === 'p').to.be.ok;
    });
    it('不应该选中', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });

        expect(cssSelector.queryAll('div [class=test]').length).to.eq(0);
        expect(cssSelector.queryAll('div [class=test]').length).to.eq(0);
        expect(cssSelector.queryAll('div [id=mock]').length).to.eq(0);
        expect(cssSelector.queryAll('div>[id=mock]').length).to.eq(0);
        expect(cssSelector.queryAll('div+[id=mock]').length).to.eq(0);
        expect(cssSelector.queryAll('div~[id=mock]').length).to.eq(0);
    });
    it('*', async () => {
        const cssSelector = await createCssSelectorForHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        // fixme 改元素选择为全元素,包括Text
        expect(cssSelector.queryAll('*').filter((item) => item.context!.node.attrs).length).to.eq(4);
        expect(cssSelector.queryAll('div *').filter((item) => item.context!.node.attrs).length).to.eq(2);
    });
    it('解析失败抛出异常', async () => {
        try {
            await createCssSelectorForHtml('<div <div>', {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            });
        } catch (error) {
            return expect(error).to.be.ok;
        }
        throw new Error('');
    });
    it('定位', async () => {
        const selector = await createCssSelectorForHtml('<div><span></span></div>', {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = selector.locate([7, 7]);
        expect(result.length).to.eq(2);
    });
    it('伪元素', async () => {
        const selector = await createCssSelectorForHtml('<div><span>1</span></div>', {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = selector.queryAll('div span:has([value=1])');
        expect(result.length).to.eq(1);
    });
    it('增加属性子节点', async () => {
        const selector = await createCssSelectorForHtml('<div class="a"></div>', {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = selector.queryAll('div class');
        expect(result.length).to.eq(1);
    });
});
