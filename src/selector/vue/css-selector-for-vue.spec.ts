import { expect } from 'chai';
import { createCssSelectorForVue } from './css-selector-for-vue';

const mockHtml = `<template>
<div class="example">{{ msg }}</div>
</template>

<script>
export default {
data() {
  return {
    msg: 'Hello world!'
  }
}
}
</script>

<style>
.example {
color: red;
}
</style>

<custom1>
This could be e.g. documentation for the component.
</custom1>`;
describe('用于vue的css选择器', () => {
    it('初始化', async () => {
        const cssSelector = createCssSelectorForVue(mockHtml);
        expect(cssSelector).to.be.ok;
        const tree = cssSelector.getAstTree();
        expect(tree.children.length).to.eq(4);
    });
    it('查询', async () => {
        const cssSelector = createCssSelectorForVue(mockHtml, undefined, {});
        let result = cssSelector.queryOne('PlainElementNode:raw([tag=template])');
        expect(result).to.be.ok;
        result = cssSelector.queryOne('PlainElementNode[class=example]');
        expect(result).to.be.ok;
    });
    it('事件', () => {
        const cssSelector = createCssSelectorForVue(
            `<button @click="count++">
        Count is: {{ count }}
      </button>`,
            undefined,
            {}
        );
        const result = cssSelector.queryOne(':raw([tag=button])[click]');
        expect(result).to.be.ok;
    });
    it('class', async () => {
        const cssSelector = createCssSelectorForVue('<button :class="abc"></button>', undefined, {});
        const result = cssSelector.queryOne('[value=abc]');
        expect(result).to.be.ok;
    });
    it('SimpleExpressionNode', async () => {
        const cssSelector = createCssSelectorForVue('<h1 v-if="awesome">aaa</h1>', undefined, {});
        const result = cssSelector.queryOne('SimpleExpressionNode[value=awesome]');
        expect(result).to.be.ok;
    });
});
