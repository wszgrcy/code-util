import { addData } from './util';

import fs from 'fs';
import path from 'path';
let VSCODE_PATH = '/home/chen/third-project/vscode';
export async function vscodeExtname(tempList: any[]) {
    let dir = path.join(VSCODE_PATH, 'extensions');
    let list = fs.readdirSync(dir);
    for (const item of list) {
        let configPath = path.join(dir, item, 'package.json');
        let exist = fs.existsSync(configPath);
        if (!exist) {
            continue;
        }
        let data = JSON.parse(await fs.promises.readFile(configPath, { encoding: 'utf-8' }));
        if (!data.contributes?.languages) {
            continue;
        }
        let languageList = data.contributes?.languages;
        for (const item of languageList) {
            let extensions = item.extensions;
            if (!extensions) {
                continue;
            }
            let aliases = [...new Set([...(item.aliases || []), item.id].map((item: string) => item.toLocaleLowerCase()))];
            for (const item of aliases) {
                addData(tempList, { lang: aliases, ext: extensions });
            }
        }
    }
}
