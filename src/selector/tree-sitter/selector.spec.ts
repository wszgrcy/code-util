import { expect } from 'chai';
import { createCssSelectorForTreeSitter } from './selector';
import * as fs from 'fs';
import * as path from 'path';

describe('tree-sitter', () => {
    //! 运行之前需要编译
    describe('typescript', () => {
        it('默认', async () => {
            const s = await createCssSelectorForTreeSitter(
                'let a=1',
                {
                    loadPackage: Promise.resolve({ path: path.resolve(process.cwd(), 'lib/tree-sitter', 'typescript.wasm') }),
                    language: 'typescript',
                },
                {}
            );
            const list = s.getAstTree(s.rootNodeList, true);
            expect(list.children.length).to.be.ok;
        });

        it('查询', async () => {
            const s = await createCssSelectorForTreeSitter(
                'let a=1',
                {
                    loadPackage: Promise.resolve({ path: path.resolve(process.cwd(), 'lib/tree-sitter', 'typescript.wasm') }),
                    language: 'typescript',
                },
                {}
            );
            const item = s.queryOne('variable_declarator');
            expect(item).to.be.ok;
            expect(item.value).to.eq('a=1');
        });
    });
    it('html', async () => {
        const wasm = fs.readFileSync(path.resolve(process.cwd(), 'lib/tree-sitter', 'html.wasm'));
        const s = await createCssSelectorForTreeSitter(
            '<div>1</div>',
            { loadPackage: Promise.resolve({ path: new Uint8Array(wasm) }), language: 'html' },
            {}
        );
        const list = s.getAstTree(s.rootNodeList, true);
        expect(list.children.length).to.be.ok;
    });
    // 修改后最大3804次,可能有泄漏或者需要清理?
    it.skip('typescript-异常', async () => {
        for (let i = 0; i < 10000; i++) {
            console.log(i);

            const s = await createCssSelectorForTreeSitter(
                fs.readFileSync(path.join(process.cwd(), 'test/fixture/tree-sitter/error.ts'), { encoding: 'utf-8' }),
                {
                    loadPackage: Promise.resolve({ path: path.resolve(process.cwd(), 'lib/tree-sitter', 'typescript.wasm') }),
                    language: 'typescript',
                },
                {}
            );
            const list = s.getAstTree(s.rootNodeList, true);
            expect(list.children.length).to.be.ok;
        }
    });
});
