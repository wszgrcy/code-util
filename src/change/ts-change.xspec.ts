import ts from 'typescript';
import { createCssSelectorForTs } from '../selector';
import { InsertChange, DeleteChange } from './content-change';
import { TsChange } from './ts-change';
import { UpdaterPlain } from '../updater/updater-plain';

describe('ts-change', () => {
    const content = 'let a=/**number*/2';
    const file = ts.createSourceFile('', content, ts.ScriptTarget.Latest, true);
    it('替换内容', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.replaceNode(node, '233');
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=/**number*/233');
    });
    it('替换内容(包括注释)', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.replaceNode(node, '233', { full: true });
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=233');
    });
    it('删除内容', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.deleteNode(node);
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=/**number*/');
    });
    it('删除内容(包括注释)', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.deleteNode(node, { full: true });
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=');
    });
    it('增加内容(前)', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.insertNode(node, 'abc', 'start');
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=/**number*/abc2');
    });
    it('增加内容(后)', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.insertNode(node, 'abc', 'end');
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq(content + 'abc');
    });
    it('增加内容(包括注释)', () => {
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('NumericLiteral');
        const change = new TsChange(file);
        const result = change.insertNode(node, 'abc', 'start', { full: true });
        const newContent = UpdaterPlain.update(content, [result]);
        expect(newContent).to.eq('let a=abc/**number*/2');
    });
    it('插入子节点内容(对象)', () => {
        const file = ts.createSourceFile('', 'let a={b:1}', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, 'abc:2');
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a={b:1,abc:2}');
    });
    it('插入子节点内容(对象,尾逗号)', () => {
        const file = ts.createSourceFile('', 'let a={b:1/**注释*/,}', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, 'abc:2');
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a={b:1/**注释*/,abc:2,}');
    });
    it('插入子节点内容(对象,尾逗号,位置)', () => {
        const file = ts.createSourceFile('', 'let a={b:1/**注释*/,}', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, 'abc:2', 0);
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a={abc:2,b:1/**注释*/,}');
    });
    it('插入子节点内容(空对象)', () => {
        const file = ts.createSourceFile('', 'let a={}', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, 'abc:2');
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a={abc:2}');
    });
    it('插入子节点内容(空数组)', () => {
        const file = ts.createSourceFile('', 'let a=[]', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ArrayLiteralExpression') as ts.ArrayLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, '1');
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a=[1]');
    });
    it('插入子节点内容(数组)', () => {
        const file = ts.createSourceFile('', 'let a=[2]', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ArrayLiteralExpression') as ts.ArrayLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, '1');
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a=[2,1]');
    });
    it('插入子节点内容(数组,位置)', () => {
        const file = ts.createSourceFile('', 'let a=[2]', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ArrayLiteralExpression') as ts.ArrayLiteralExpression;
        const change = new TsChange(file);
        const result = change.insertChildNode(node, '1', 0);
        const newContent = UpdaterPlain.update(file.text, [result]);
        expect(newContent).to.eq('let a=[1,2]');
    });
    it('删除子节点内容(对象)', () => {
        const file = ts.createSourceFile('', 'let a={a:1/**abc*/,b:2,c:3}', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        let result = change.deleteChildNode(node, (node) => node.getText().includes('a')).sort((a, b) => b.start - a.start);
        let newContent = file.text;
        result.forEach((change) => {
            newContent = UpdaterPlain.update(newContent, [change]);
        });
        expect(newContent).to.eq('let a={b:2,c:3}');
        result = change.deleteChildNode(node, (node) => node.getText().includes('b')).sort((a, b) => b.start - a.start);
        newContent = file.text;
        result.forEach((change) => {
            newContent = UpdaterPlain.update(newContent, [change]);
        });
        expect(newContent).to.eq('let a={a:1/**abc*/,c:3}');
    });
    it('删除子节点内容(数组)', () => {
        const file = ts.createSourceFile('', 'let a=[1/**abc*/,2,3]', ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ArrayLiteralExpression') as ts.ArrayLiteralExpression;
        const change = new TsChange(file);
        let result = change.deleteChildNode(node, (node) => node.getText().includes('1')).sort((a, b) => b.start - a.start);
        let newContent = file.text;
        result.forEach((change) => {
            newContent = UpdaterPlain.update(newContent, [change]);
        });
        expect(newContent).to.eq('let a=[2,3]');
        result = change.deleteChildNode(node, (node) => node.getText().includes('2')).sort((a, b) => b.start - a.start);
        newContent = file.text;
        result.forEach((change) => {
            newContent = UpdaterPlain.update(newContent, [change]);
        });
        expect(newContent).to.eq('let a=[1/**abc*/,3]');
    });
    it('替换子节点内容(对象,尾逗号,中间)', () => {
        const file = ts.createSourceFile('', "let a={a: '1',b: '2',c: ['3']// d:[4]}", ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const changeList: (InsertChange | DeleteChange)[] = change.deleteChildNode(node, (node, index) => index === 1 || index === 2);

        changeList.push(change.insertChildNode(node, 'ab:2'));
        let newContent = file.text;
        changeList
            .sort((a, b) => b.start - a.start)
            .forEach((change) => {
                newContent = UpdaterPlain.update(newContent, [change]);
            });
        expect(newContent).to.eq("let a={a: '1',ab:2// d:[4]}");
    });
    it('对象中间插入字段', () => {
        const file = ts.createSourceFile('', "let a={a: '1',b: '2',c: ['3']}", ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const insertChange = change.insertChildNode(node, "insert:'a'", 1);
        const newContent = UpdaterPlain.update(file.text, [insertChange]);
        expect(newContent).to.eq("let a={a: '1',insert:'a',b: '2',c: ['3']}");
    });
    it('对象中间删除节点', () => {
        const file = ts.createSourceFile('', "let a={a: '1',b: '2',c: ['3']}", ts.ScriptTarget.Latest, true);
        const selector = createCssSelectorForTs(file);
        const node = selector.queryOne('ObjectLiteralExpression') as ts.ObjectLiteralExpression;
        const change = new TsChange(file);
        const changeList = change.deleteChildNode(node, (item, index) => {
            if (index === 2 || index === 0) {
                return true;
            }
            return false;
        });
        let newContent = file.text;
        changeList
            .sort((a, b) => b.start - a.start)
            .forEach((item) => {
                newContent = UpdaterPlain.update(newContent, [item]);
            });
        expect(newContent).to.eq("let a={b: '2'}");
    });
});
