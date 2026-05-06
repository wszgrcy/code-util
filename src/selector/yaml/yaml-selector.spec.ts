import { expect } from 'chai';
import { createCssSelectorForYAML } from './yaml-selector';
import { join } from 'path';
import { readFileSync } from 'fs';
const FIXTURE_DIR = join(process.cwd(), './test/fixture');
describe('YAML', () => {
    it('开始', () => {
        const s = createCssSelectorForYAML('- name');
        const result = s.getAstTree().children;
        expect(result.length).eq(1);
        expect(result[0].value).eq('- name');
    });
    it('测试节点列表', () => {
        const s = createCssSelectorForYAML(readFileSync(join(FIXTURE_DIR, 'yaml/test.yaml'), { encoding: 'utf-8' }));
        const result = s.getAstTree().children;
        expect(result.length).eq(1);
    });
    it('多文件', () => {
        const s = createCssSelectorForYAML(readFileSync(join(FIXTURE_DIR, 'yaml/multi-file.yaml'), { encoding: 'utf-8' }));
        const result = s.getAstTree().children;
        expect(result.length).eq(2);
    });
});
