import { expect } from 'chai';
import { createCssSelectorForPgsqlAstParser } from './css-selector-for-pgsql-ast-parser';
describe('pgsql-ast-parser', () => {
    it('初始化', () => {
        const s = createCssSelectorForPgsqlAstParser("insert into my_table values (1, 'two')", {});
        expect(s).to.be.ok;
    });
    it('查询', () => {
        const s = createCssSelectorForPgsqlAstParser(
            `BEGIN TRANSACTION;
        insert into my_table values (1, 'two')`,
            {}
        );
        const result = s.queryAll('[value=my_table]');
        expect(result.length).to.be.ok;
    });
});
