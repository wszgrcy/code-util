import { expect } from 'chai';
import { loadEsmModule } from '../../util';
import { createCssSelectorForNgHtml } from './css-selector-for-ng-html';

const mockHtml = `<div class="test" id="mock" *ngIf="xx" [name]="yyy" (output1)="zzz()" #ref1>
<p>123<code></code>  </p>
</div><span></span><ng-template let-variable1></ng-template>{{'BoundText'}}<ng-content></ng-content>str`;
describe('用于ng-html的css选择器', () => {
    it('初始化', async () => {
        const cssSelector = await createCssSelectorForNgHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        expect(cssSelector).to.be.ok;
    });
    it('标签查询', async () => {
        const cssSelector = await createCssSelectorForNgHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        let result = cssSelector.queryAll('Element');
        expect(result.length).to.eq(4);
        result = cssSelector.queryAll('Text');
        expect(result.length).to.eq(2);
    });
    it('input', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[input~=name]');
        expect(result.length).to.eq(1);
    });
    it('output', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[output~=output1]');
        expect(result.length).to.eq(1);
    });
    it('templateAttr', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[templateAttr~=ngIf]');
        expect(result.length).to.eq(1);
    });
    it('variable', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[variable]');
        expect(result.length).to.eq(1);
    });
    it('reference', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[reference]');
        expect(result.length).to.eq(1);
    });
    it('attribute', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            mockHtml,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryAll('[attribute~=class]');
        expect(result.length).to.eq(1);
    });
    it('BoundText', async () => {
        const cssSelector = await createCssSelectorForNgHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('BoundText');
        expect(result.length).to.eq(1);
    });
    it('Content', async () => {
        const cssSelector = await createCssSelectorForNgHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.queryAll('Content');
        expect(result.length).to.eq(1);
    });
    it('解析失败抛出异常', async () => {
        try {
            await await createCssSelectorForNgHtml('<div <div>', {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            });
        } catch (error) {
            return expect(error).to.be.ok;
        }
        throw new Error('');
    });
    it('自定义绑定标记', async () => {
        const selector = await createCssSelectorForNgHtml('[[htmlContent]]', {
            interpolationConfig: {
                start: '[[',
                end: ']]',
            },
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = selector.queryAll('BoundText');
        expect(result.length).to.eq(1);
    });
    it('定位', async () => {
        const cssSelector = await createCssSelectorForNgHtml(mockHtml, {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        const result = cssSelector.locate([1, 1]);
        expect(result.length).to.eq(2);
    });
    it('增加属性节点 element', async () => {
        const cssSelector = await createCssSelectorForNgHtml(
            '<div #abc id="aa" [class]="bb" (output)="output1($event)" insert="{{insert1}}"></div>',
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            }
        );
        let result = cssSelector.queryAll('Element TextAttribute');
        expect(result.length).to.be.above(0);
        result = cssSelector.queryAll('Element BoundAttribute[value^=[class]');
        expect(result.length).to.be.above(0);
        expect(result[0].value).to.eq('[class]="bb"');
        result = cssSelector.queryAll('Element BoundEvent[value^=(output)]');
        expect(result.length).to.be.above(0);
        result = cssSelector.queryAll('Element Reference[value=#abc]');
        expect(result.length).to.be.above(0);
    });
    it('增加属性节点 template', async () => {
        const cssSelector = await createCssSelectorForNgHtml('<ng-template #abc let-value1></ng-template>', {
            module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
        });
        let result = cssSelector.queryAll('Template Reference[value=#abc]');
        expect(result.length).to.be.above(0);
        result = cssSelector.queryAll('Template Variable[value=let-value1]');
        expect(result.length).to.be.above(0);
    });
    it('ng17块', async () => {
        //@if (true) {<ng-container>13124</ng-container>}
        //@for (item of items; track $index) {}@empty {}
        //@switch (1) {@case (1) {1}@default {2}}
        //@defer (on viewport) {} @placeholder {<p></p>}
        const cssSelector = await createCssSelectorForNgHtml(
            `
            @if (true) {<ng-container>13124</ng-container>}`,
            {
                module$$: loadEsmModule<typeof import('@angular/compiler')>('@angular/compiler'),
            },
            {}
        );
        const result = cssSelector.queryOne('IfBlockBranch');
        expect(result).to.be.ok;
        const result2 = result.extra['sourceSpanRange'].value;
        expect(result2 instanceof Array).to.be.ok;
        const result3 = result.extra['expressionRange'].value;
        expect(result3 instanceof Array).to.be.ok;
    });
});
