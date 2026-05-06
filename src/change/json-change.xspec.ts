import { Node } from 'jsonc-parser';
import { createCssSelectorForJson } from '../selector/jsonc-paraser/css-selector-for-json';
import { JsonChange } from './json-change';
import { UpdaterPlain } from '../updater/updater-plain';
// todo 由于改变了选择方式,所以原来的测试都废弃,
xdescribe('json-change', () => {
    const content = '{"key1":"value1"}';
    let change: JsonChange;
    let node: Node;
    beforeEach(() => {
        const selector = createCssSelectorForJson(content);
        node = selector.queryOne('key1');
        change = new JsonChange();
    });
    it('替换key', () => {
        const replaceChange = change.replaceKey(node, '"key2"');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key2":"value1"}');
    });
    it('替换value', () => {
        const replaceChange = change.replaceValue(node, '"value2"');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key1":"value2"}');
    });
    it('删除节点(2)', () => {
        const content = '{"key1":"value1","key2":"value2"}';
        const selector = createCssSelectorForJson(content);
        node = selector.queryOne('key2');
        change = new JsonChange();
        const replaceChange = change.deleteNode(node);
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key1":"value1"}');
    });
    it('删除节点(1)', () => {
        const content = '{"key1":"value1"}';
        const selector = createCssSelectorForJson(content);
        node = selector.queryOne('key1');
        change = new JsonChange();
        const replaceChange = change.deleteNode(node);
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{}');
    });
    it('插入节点(before)', () => {
        const replaceChange = change.insertNode(node, '"a":"b"');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"a":"b","key1":"value1"}');
    });
    it('插入节点(after)', () => {
        const replaceChange = change.insertNode(node, '"a":"b"', 'after');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key1":"value1","a":"b"}');
    });
    it('插入子节点(0)', () => {
        const content = '{"key1":{}}';
        const selector = createCssSelectorForJson(content);
        node = selector.queryOne('key1');
        change = new JsonChange();
        const replaceChange = change.insertChildNode(node, '"sub1":""');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key1":{"sub1":""}}');
    });
    it('插入子节点(1)', () => {
        const content = '{"key1":{"sub1":""}}';
        const selector = createCssSelectorForJson(content);
        node = selector.queryOne('key1');
        change = new JsonChange();
        const replaceChange = change.insertChildNode(node, '"sub2":""');
        const result = UpdaterPlain.update(content, [replaceChange]);
        expect(result).to.eq('{"key1":{"sub1":"","sub2":""}}');
    });
});
