import { expect } from 'chai';
import { createCssSelectorForLezer } from './css-selector-for-lezer';
import * as fs from 'fs';
import * as path from 'path';
describe('rust', () => {
    it('初始化', async () => {
        const s = await createCssSelectorForLezer(
            `fn main(){
                let a = b.1.2.3.4;
                let c = 1.2345;
            }`,
            { package$$: import('@lezer/rust') },
            {}
        );
        expect(s).to.be.ok;
    });
    it('查询', async () => {
        const s = await createCssSelectorForLezer(
            `fn main(){
                let a = b.1.2.3.4;
                let c = 1.2345;
            }`,
            { package$$: import('@lezer/rust') },
            {}
        );
        const result = s.queryAll('[value=main]');
        expect(result.length).to.be.ok;
    });
    it('速度慢', async () => {
        const content = await fs.promises.readFile(path.join(process.cwd(), './test/fixture/rust-slow.rs'), { encoding: 'utf-8' });
        const s = await createCssSelectorForLezer(content, { package$$: import('@lezer/rust') }, {});
    });
});
