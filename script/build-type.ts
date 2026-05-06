import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';

import { Extractor, ExtractorConfig, ExtractorResult } from '@microsoft/api-extractor';
const apiExtractorJsonPath: string = path.join(process.cwd(), './api-extractor.json');

function main() {
    extract();
    afterExtract();
}
function extract() {
    let list = [
        { in: 'index.d.ts' },
        ...glob.sync('selector/**/index.d.ts', { cwd: path.join(process.cwd(), './temp/type') }).map((item) => {
            return { in: item };
        }),
    ];
    let extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
    for (const item of list) {
        let config = {
            ...extractorConfig,
            mainEntryPointFilePath: path.join(process.cwd(), `./temp/type/${item.in}`),
            untrimmedFilePath: path.join(process.cwd(), `./dist/${item.in}`),
        } as ExtractorConfig;
        const extractorResult: ExtractorResult = Extractor.invoke(config, {
            localBuild: true,
            showVerboseMessages: true,
        });

        if (extractorResult.succeeded) {
        } else {
            throw new Error(
                `API Extractor completed with ${extractorResult.errorCount} errors` + ` and ${extractorResult.warningCount} warnings`
            );
        }
    }
    console.log(`执行完成`);
}
function afterExtract() {
    let bundlePath = path.join(process.cwd(), './dist/selector/angular/index.d.ts');
    let content = fs.readFileSync(bundlePath, { encoding: 'utf-8' });
    let replaceContent = `import { angularCompiler } from '@angular/compiler';`;
    let index = content.indexOf(replaceContent);
    if (index === -1) {
        throw new Error('node insert anchor find! please update content');
    }
    fs.writeFileSync(bundlePath, content.replace(replaceContent, `type angularCompiler = typeof import('@angular/compiler')`));
}
main();
