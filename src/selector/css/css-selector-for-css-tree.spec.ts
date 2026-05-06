import { expect } from 'chai';
import { createCssSelectorForCSSTree } from './css-selector-for-css-tree';
describe('css-tree', () => {
    it('初始化', () => {
        const s = createCssSelectorForCSSTree('.example { world: "!" }', {});
        expect(s).to.be.ok;
    });
    it('子元素', () => {
        const s = createCssSelectorForCSSTree('.example { world: "!" }', {});
        const result = s.queryAll('[value=.example]');
        result;
        expect(result.length).to.be.ok;
    });
});
