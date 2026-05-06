import * as path from 'path';
import * as fs from 'fs';
import { homedir } from 'os';
import { createCssSelectorForHtmlParser2 } from '../../src/selector/htmlparser2/css-selector-for-htmlparser2';
import { addData } from './util';
const pomFileName = `pom.xml`;
const GRAMMARS_PATH = path.join(process.cwd(), `lib/grammars-v4`);
export async function antlrExtname(tempList: any[]) {
    /**
     * 读文件夹,有module,继续读,
     */
    let instance = new LanguageParser(GRAMMARS_PATH, [], []);
    let result = await instance.parse();
    if (!result) {
        throw new Error(`没有收集到任何数据`);
    }
    if (!(result instanceof Array)) {
        throw new Error(`返回结果应该是列表`);
    }
    let list = result.flat(9) as any as LanguageResult[];
    // console.log(JSON.stringify(list, undefined, 4));
    // fs.writeFileSync(path.join(process.cwd(), `antlr.json`), JSON.stringify(list, undefined, 4));
    for (const item of list) {
        addData(tempList, { lang: [item.id], ext: item.extensions });
    }
}
interface LanguageResult {
    id: string;
    extensions: string[];
}
type LanguageResultList = (LanguageResult | LanguageResultList)[];
class LanguageParser {
    list: { id: string; dir: string }[] = [];
    reader;
    id!: string;
    constructor(private fileDir: string, private levelList: string[], private idList: string[]) {
        this.reader = new XmlReader(path.join(fileDir, pomFileName));
    }
    async parse(): Promise<LanguageResult | LanguageResultList | undefined> {
        this.id = await this.reader.getId();
        if (await this.reader.isBuild()) {
            return this.readLanguage();
        }
        if (await this.reader.isDir()) {
            return this.readSubList();
        }
        throw new Error(`非文件夹和语言`);
    }
    async readLanguage(): Promise<LanguageResult | undefined> {
        let examples = path.join(this.fileDir, 'examples');
        if (!fs.existsSync(examples)) {
            console.log('----', this.id, 'examples不存在');
            return;
        }
        let newSet = new Set<string>();
        this.#getDir(examples, newSet);
        if (newSet.size) {
            return { id: this.id.toLowerCase(), extensions: [...newSet].map((item) => item) };
        }
        return undefined;
    }
    #getDir(dir: string, set: Set<string>) {
        let list = fs.readdirSync(dir);
        for (const item of list) {
            let filePath = path.join(dir, item);
            let stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.#getDir(filePath, set);
            } else {
                let extname = path.extname(filePath);
                if (extname && extname !== '.errors' && extname !== '.tree' && extname !== '.txt') {
                    set.add(extname);
                }
            }
        }
    }
    async readSubList(): Promise<LanguageResultList> {
        let list = await this.reader.getModules();
        let resultList: LanguageResultList = [];
        for (const item of list) {
            let instance = new LanguageParser(path.join(this.fileDir, item), [...this.levelList, item], [...this.idList, this.id]);
            let result = await instance.parse();
            if (result) {
                resultList.push(result);
            }
        }
        return resultList;
    }
}
class XmlReader {
    #selector;

    constructor(filePath: string) {
        let content = fs.readFileSync(filePath, { encoding: 'utf-8' });
        this.#selector = createCssSelectorForHtmlParser2(content, { xmlMode: true });
    }
    async getId() {
        let selector = await this.#selector;
        let rootProject = selector.queryOne(`project`);
        return (selector.queryOne(rootProject, `>artifactId::children(0)`) as any)?.value;
    }
    async getModules() {
        return (await this.#selector).queryAll(`modules module`).map((item) => ((item as any).children[0] as any).value as string);
    }

    async isBuild() {
        let selector = await this.#selector;
        let result = selector.queryOne(`build plugin:has(groupId:has([value=org.antlr]))`);
        return !!(await this.#selector).queryOne(`build plugin:has(groupId:has([value=org.antlr]))`);
    }
    async isDir() {
        return !!(await this.#selector).queryOne(`modules`);
    }
}
