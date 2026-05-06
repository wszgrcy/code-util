import { antlrExtname } from './antlr.extname';
import { vscodeExtname } from './vscode.extname';
import fs from 'fs';
import path from 'path';
import didYouMean from 'didyoumean2';
import { distance } from 'fastest-levenshtein';

export async function main() {
    /** 可能的语言对应的后缀 */
    let list = [] as { lang: string[]; ext: string[] }[];
    await vscodeExtname(list);
    await antlrExtname(list);
    // fs.writeFileSync(path.join(process.cwd(), 'script', 'asset', 'extname-list.json'), JSON.stringify(list, undefined, 2));

    let antlrPath = path.join(process.cwd(), './src/antlr/grammars/manifest.json');
    let antlrData = JSON.parse(fs.readFileSync(antlrPath, { encoding: 'utf-8' })) as any[];
    let treeSitterPath = path.join(process.cwd(), './lib/tree-sitter/manifest.json');
    let treeSitterData = JSON.parse(fs.readFileSync(treeSitterPath, { encoding: 'utf-8' })) as any[];

    let parserList: { use: string; language: string[] }[] = [
        { use: 'typescript', language: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'] },
        { use: '@angular/compiler', language: ['ng-html', 'html'] },
        { use: 'htmlparser2', language: ['xml', 'html'] },
        { use: 'jsonc-parser', language: ['json'] },
        { use: 'gsql-ast-parser', language: ['sql'] },
        { use: '@vue/compiler-dom', language: ['vue'] },
        {
            use: 'yaml',
            language: ['yaml'],
        },
        {
            use: '@lezer',
            language: ['cpp', 'css', 'html', 'java', 'javascript', 'json', 'lezer', 'markdown', 'php', 'python', 'rust', 'sass', 'xml'],
        },
        { use: 'antlr4', language: antlrData.map((item) => item.id) },
        { use: 'tree-sitter', language: treeSitterData },
    ];
    let extObj = {} as Record<string, any>;
    let extname = JSON.parse(await fs.promises.readFile(path.join(process.cwd(), 'script/ext', './map.json'), { encoding: 'utf-8' }));
    list = [...extname, ...list];
    for (const item of parserList) {
        for (const language of item.language) {
            let matchedItem = list.find((maybeItem) => didYouMean(language.toLowerCase(), maybeItem.lang, { threshold: 0.9 }));
            if (matchedItem) {
                for (const extItem of matchedItem.ext) {
                    extObj[extItem] ??= [];
                    extObj[extItem].push({ use: item.use, language });
                }
            } else {
                console.warn('未查询到', item.use, language);
            }
        }
    }

    for (const key in extObj) {
        const item = extObj[key];
        item.sort((a: any, b: any) => {
            let cKey = key.startsWith('.') ? key.slice(1) : key;
            cKey = cKey.toLowerCase();
            return distance(cKey, a.language.toLowerCase()) - distance(cKey, b.language.toLowerCase());
        });
    }
    fs.writeFileSync(path.join(process.cwd(), 'script', 'asset', 'extname.json'), JSON.stringify(extObj, undefined, 2));
    fs.writeFileSync(path.join(process.cwd(), 'script', 'asset', 'parser-list.json'), JSON.stringify(parserList, undefined, 2));
}
main();
