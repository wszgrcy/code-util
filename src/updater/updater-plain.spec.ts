import { expect } from 'chai';
import { DeleteChange, InsertChange, ReplaceChange } from '../change/content-change';
import { UpdaterPlain } from './updater-plain';
describe('更新纯文本', () => {
    const content = '123456';
    it('插入', () => {
        const list = [new InsertChange(0, 'insert')];
        const result = UpdaterPlain.update(content, list);
        expect(result).to.eq('insert123456');
    });
    it('删除', () => {
        const list = [new DeleteChange(0, 1)];
        const result = UpdaterPlain.update(content, list);
        expect(result).to.eq('23456');
    });
    it('替换', () => {
        const list = [new ReplaceChange(0, 1, 'insert')];
        const result = UpdaterPlain.update(content, list);
        expect(result).to.eq('insert23456');
    });
    it('组合', () => {
        const list = [new InsertChange(3, 'insert1'), new ReplaceChange(0, 1, 'insert2')];
        const result = UpdaterPlain.update(content, list);
        expect(result).to.eq('insert223insert1456');
    });
});
