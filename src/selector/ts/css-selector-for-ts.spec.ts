import ts from 'typescript';
import { createCssSelectorForTs } from './css-selector-for-ts';
import { expect } from 'chai';

function createSourceFile(content: string, name = '') {
    return ts.createSourceFile(name, content, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
}
function mockSourceFile() {
    return createSourceFile('');
}
describe('用于ts node的css选择器', () => {
    it('初始化', () => {
        const sourceFile = mockSourceFile();
        const cssSelector = createCssSelectorForTs(sourceFile);
        expect(cssSelector).to.be.ok;
    });
    it('默认', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('VariableDeclaration Identifier');
        expect(result.length).to.eq(1);
    });
    it('~', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('Identifier~NumericLiteral');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind === ts.SyntaxKind.NumericLiteral).to.be.true;
    });
    it('>', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('VariableDeclaration>Identifier');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind === ts.SyntaxKind.Identifier).to.be.true;
    });
    it(',', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('VariableDeclaration,Identifier');

        expect(result.length).to.eq(2);
    });
    it('attribute equal', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('VariableDeclaration::name[value=a]::parent');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.VariableDeclaration);
    });
    it('attribute exist', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=6'));
        const result = s.queryAll('VariableDeclaration::name::parent');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.VariableDeclaration);
    });
    it('attribute any', () => {
        const s = createCssSelectorForTs(createSourceFile('let a=689'));
        const result = s.queryAll('VariableDeclaration::initializer[value*=8]::parent');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.VariableDeclaration);
    });
    it('传入字符串', () => {
        const s = createCssSelectorForTs('let a=689');
        const result = s.queryAll('VariableDeclaration');

        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.VariableDeclaration);
    });
    it('普通 node 做根节点', () => {
        const sourceFile = ts.createSourceFile('', 'let a=[1,2]', ts.ScriptTarget.Latest, true);
        const s = createCssSelectorForTs(sourceFile);
        const nodeSelector = createCssSelectorForTs(s.queryOne('ArrayLiteralExpression').context!.node);
        nodeSelector.setSourceFile(sourceFile);
        const result = nodeSelector.queryAll('NumericLiteral');
        expect(result.length).to.eq(2);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.NumericLiteral);
    });
    it('普通 node 做根节点(属性查询)', () => {
        const sourceFile = ts.createSourceFile('', 'let a={b:1}', ts.ScriptTarget.Latest);
        const s = createCssSelectorForTs(sourceFile);
        const nodeSelector = createCssSelectorForTs(s.queryOne('ObjectLiteralExpression').context!.node);
        nodeSelector.setSourceFile(sourceFile);
        const result = nodeSelector.queryAll('PropertyAssignment::name[value=b]<PropertyAssignment');
        expect(result.length).to.eq(1);
        expect(result[0].context!.node.kind).to.eq(ts.SyntaxKind.PropertyAssignment);
    });
    it('forEachChild', () => {
        const s = createCssSelectorForTs('let a=1', { childrenMode: 'forEachChild' });
        expect(s.queryOne('*::name[value=a]::parent')).to.be.ok;
    });
    it('StringLiteral text属性', () => {
        const s = createCssSelectorForTs('let a="1"', undefined, {});
        let res = s.queryAll('StringLiteral[text=1]');
        expect(res.length).to.eq(1);
        res = s.queryAll('StringLiteral[getText=\'"1"\']');
        expect(res.length).to.eq(1);
    });
    it('bug:*选择器选子级', () => {
        const s = createCssSelectorForTs('let a={b:1}', { childrenMode: 'getChildren' });
        const res = s.queryAll('VariableDeclaration >EqualsToken+*');
        expect(res.length).to.eq(1);
    });
    it('::name 伪元素', () => {
        let s = createCssSelectorForTs('let a=6');
        let res = s.queryAll('VariableDeclaration::name');
        expect(res.length).to.eq(1);
        expect(res[0].value).to.eq('a');
        s = createCssSelectorForTs('let b={key:1}');
        res = s.queryAll('VariableDeclaration::initializer::properties(0)');
        expect(res.length).to.eq(1);
        expect(res[0].context!.node.kind).to.eq(ts.SyntaxKind.PropertyAssignment);
    });
    it('阶段性反向查询', () => {
        const s = createCssSelectorForTs('let a=6');
        const result = s.queryOne('VariableDeclaration::name');
        const result1 = s.queryOne(result, '<VariableDeclaration');
        expect(result1).to.be.ok;
        expect(result1.value).to.eq('a=6');
    });
    it('定位', () => {
        const s = createCssSelectorForTs('let a=6');
        const result = s.locate([3, 3]);
        expect(result.length).to.eq(5);
    });
    it('ast-tree', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.getAstTree();
        // expect([...result.callbackMap.keys()].some((item) => item.includes('getFullStart'))).to.eq(true);
        expect(result).to.be.ok;
    });
    it('伪元素', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.queryOne('VariableDeclaration::name');
        expect(result).to.be.ok;
        expect(result.value).to.eq('a');
    });
    it('伪元素重复查询', () => {
        const s = createCssSelectorForTs('if (ngDevMode && code < 0) {}', undefined, {});
        const result = s.queryOne('IfStatement::expression');
        const result2 = s.queryOne('IfStatement::expression');
        expect(result).to.be.ok;
        expect(result2).to.be.ok;
    });
    it('伪元素重复查询', () => {
        const s = createCssSelectorForTs('/**1*/let a=2', undefined, {});
        const result = s.queryOne('VariableStatement');
        const a = result.extra['rangeWithComment'];
        const range = (result.context?.map.get(a!.value as string) as any)();
        expect(range[0]).to.eq(0);
        expect(range[1]).to.eq(13);
    });
    it.skip('use二次查询 todo 需要加一个&表示自身引用', () => {
        const s = createCssSelectorForTs("$localize`hello${'world'}`", undefined, {});
        const result = s.queryOne('TemplateExpression');
        const list = s.queryAll(result, ':use(TemplateHead,SyntaxList>TemplateSpan>TemplateMiddle)');
        list;
    });

    // 因为伪元素会被小写化
    xit('伪元素查询失败', () => {
        const s = createCssSelectorForTs(
            `    const flags = InjectFlags.Default | (dep.self ? InjectFlags.Self : 0) |
        (dep.skipSelf ? InjectFlags.SkipSelf : 0) | (dep.host ? InjectFlags.Host : 0) |
        (dep.optional ? InjectFlags.Optional : 0) |
        (target === FactoryTarget.Pipe ? InjectFlags.ForPipe : 0);`,
            undefined,
            {}
        );
        const result = s.queryOne('ConditionalExpression::whenTrue');
        expect(result).to.be.ok;
    });
    it('like', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.queryAll('VariableStatement:like(a = [[$value1]])');
        expect(result.length).to.eq(1);
        expect(result[0].infer?.['value1']).to.ok;
        expect((result[0].infer?.['value1'] as any).value).to.eq('6');
    });
    it('like直接查询', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.match('a = [[$value1]]');
        expect(result.length).to.eq(1);
        expect(result[0].infer?.['value1']).to.ok;
        expect(result[0].value).to.eq('a=6');
        expect((result[0].infer?.['value1'] as any).value).to.eq('6');
    });
    it('like后进行查询', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.match('a = [[$value1]]');
        const result2 = s.queryOne(result[0] as any, '[value=a]');
        expect(result2).to.ok;
        expect(result2.value).to.eq('a');
    });
    it('like搜索不到', () => {
        const s = createCssSelectorForTs('let a=6', undefined, {});
        const result = s.match('aaabbb');
        expect(result.length).eq(0);
    });
    it('测试selector like', () => {
        const s = createCssSelectorForTs(
            `@Directive({
          selector: '[var]'
        })
        export class VarDirective {}`,
            undefined,
            {}
        );
        const result = s.match('@Directive( [[{]] selector:[[$selector]] [[}]] )[[...]] class [[$className]]');
        expect(result.length).eq(1);
    });
});
