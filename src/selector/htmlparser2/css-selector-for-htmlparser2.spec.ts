import { expect } from 'chai';
import { createCssSelectorForHtmlParser2 } from './css-selector-for-htmlparser2';

const mockHtml = `<div class="test" id="mock">
<p>123<code></code>  </p>
</div><span></span>`;
describe('用于ts node的css选择器', () => {
    it('初始化', async () => {
        const cssSelector = await createCssSelectorForHtmlParser2(mockHtml);
        expect(cssSelector).to.be.ok;
    });
    it('标签查询', async () => {
        const cssSelector = await createCssSelectorForHtmlParser2(mockHtml);
        const result = cssSelector.queryAll('div');
        expect(result.length).to.eq(1);
    });
    // 使用angular的无法进行source查询
    it('source查询', async () => {
        const cssSelector = await createCssSelectorForHtmlParser2('<source>Java</source>', { xmlMode: true });

        const result = cssSelector.queryAll('source');
        expect(result.length).to.eq(1);
    });
    it('[value]', async () => {
        const cssSelector = await createCssSelectorForHtmlParser2(
            '<div>123</div><span>123</span>',
            { withStartIndices: true, withEndIndices: true },
            {}
        );

        const result = cssSelector.queryAll('[value=123]');
        expect(result.length).to.eq(2);
    });
    it('[type]', async () => {
        const cssSelector = await createCssSelectorForHtmlParser2('<div>123</div>', { withStartIndices: true, withEndIndices: true }, {});

        const result = cssSelector.queryAll('[type=node]');
        expect(result.length).to.eq(1);
    });
});
