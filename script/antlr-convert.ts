import * as path from 'path';
import * as fs from 'fs';
import { homedir } from 'os';
import { createCssSelectorForHtmlParser2 } from '../src/selector/htmlparser2/css-selector-for-htmlparser2';
import _, { reject } from 'lodash';
import * as cp from 'child_process';
import normalizePath from 'normalize-path';
const pomFileName = `pom.xml`;
let rootPathName = `antlr/grammars`;
const saveDir = path.join(process.cwd(), `src/${rootPathName}`);
const javaParamsList = [`-Xmx500M`, `-cp`, `./lib/antlr-4.13.2-complete.jar`, `org.antlr.v4.Tool`];
let grammarRootPath = path.join(process.cwd(), `lib/grammars-v4`);
let filePrefix = 'https://raw.githubusercontent.com/antlr/grammars-v4/master';
const unSupportLanguageList = [
    //Character
    'apex',
    'stringtemplate',
    // 'wat',
    // 'tnsnames',
    // getCharPositionInLine
    'asn_3gpp',
    // 超类少
    'bcpl',
    'bencoding',
    'csharp',
    'databank',
    'gdscript',
    'haskell',
    'java9',
    'jsx',
    'python',
    'rexx',
    'postgresql',
    //强引入
    'antlr3',
    'ecmascript',
    'ucb-logo',
    'python2',
    'python2-js',
    'tiny-python',
    'swift5',
    // members
    'z',
    'v',
    'r',
    // 重复
    'clu',
    'lark',
    'limbo',
    'spass',
    'phoenix',
    'wat',
    'tnsnames',
    'sqlite',
    'snowflake',
    // 类型不对,
    'gff3',
    'logo',
    'velocity',
    'thrift',
    'swift3',
    'swift2',
    // 缺
    'javadoc',
    'lpc',
    'pgn',
    'rego',
    // base导出问题
    'typescript',
    'eiffel',
    'python',
    'php',
    'kirikiri-tjs',
    // antlr4ts
    'pegen',
    'java',
];
async function main(grammarDir: string) {
    let configList = await new GrammarRead().parser();
    /**
     * 读文件夹,有module,继续读,
     */
    let instance = new LanguageParser(grammarDir, [], []);
    instance.setConfigList(configList);
    let result = await instance.parse();
    if (!result) {
        throw new Error(`没有收集到任何数据`);
    }
    if (!(result instanceof Array)) {
        throw new Error(`返回结果应该是列表`);
    }
    let list = result.flat(9) as any as LanguageResult[];
    fs.promises.writeFile(path.join(saveDir, 'manifest.json'), JSON.stringify(list, null, 4));
}
interface LanguageResult {
    id: string;
    packagePath: string;
    level: string[];
    idList: string[];
}
type LanguageResultList = (LanguageResult | LanguageResultList)[];
interface GrammarConfig {
    name: string;
    lexer: string;
    parser: string;
    start: string;
    example: string[];
}
class GrammarRead {
    async read() {
        let jsonPath = path.join(grammarRootPath, 'grammars.json');
        return fs.promises.readFile(jsonPath, { encoding: 'utf-8' }).then((result) => JSON.parse(result) as GrammarConfig[]);
    }
    async parser() {
        let config = await this.read();
        for (const item of config) {
            if (item.lexer) {
                let lexerFile = item.lexer.replace(filePrefix, '');
                item.lexer = lexerFile;
            }
            if (item.parser) {
                let parserFile = item.parser.replace(filePrefix, '');
                item.parser = parserFile;
            }
        }
        return config;
    }
}
class LanguageParser {
    list: { id: string; dir: string }[] = [];
    reader;
    id!: string;
    configList!: GrammarConfig[];
    constructor(private fileDir: string, private levelList: string[], private idList: string[]) {
        this.reader = new XmlReader(path.join(fileDir, pomFileName));
    }
    setConfigList(config: GrammarConfig[]) {
        this.configList = config;
        this.reader.configList = this.configList;
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
        // if (this.id.toLocaleLowerCase().includes('python')) {
        //     debugger;
        // } else {
        //     return;
        // }
        let config = await this.reader.getLanguageConfig(this.id);
        if (!config) {
            console.warn(`${this.fileDir}文件夹内缺失必要配置,跳过`);
            return;
        }
        // if (!['limbo'].includes(config.id.toLocaleLowerCase())) {
        //     return
        // }
        let outputConfig = {
            id: config.id,
            packagePath: [...this.levelList].join('/'),
            level: this.levelList,
            idList: [...this.idList.slice(1), this.id],
        };
        console.log(`----${config.grammarName}----`);
        let dir = path.join(saveDir, ...this.levelList);
        for (const item of config.g4List) {
            /** g4文件位置 */
            let g4Path = path.join(_.template(config.dir)({ basedir: this.fileDir }), item);

            let antlrParams = [
                `-Dlanguage=TypeScript`,
                `${normalizePath(g4Path)}`,
                `-o`,
                normalizePath(path.relative(process.cwd(), path.normalize(dir))),
            ];
            let { $ } = await import('execa');
            let res = await $({ stdio: 'inherit', reject: false })('java', [...javaParamsList, ...antlrParams]);
            // let res = cp.spawnSync('java', [...javaParamsList, ...antlrParams], {
            //     stdio: 'inherit',
            //     env: process.env,
            // });
            if (res.failed) {
                throw res.stderr;
            }
        }
        let indexFile = [
            `import { CharStream, CommonTokenStream } from 'antlr4'`,
            `export { default as Lexer} from './${config.LexerName}';`,
            `export { default as Parser} from './${config.ParserName}';`,
            `export const ENTRY_NAME = '${config.entryPoint}' as const`,
            `export const ENTRY_NAME_LIST = ${JSON.stringify(config.entryPointList)}`,
            `export {CharStream, CommonTokenStream}`,
        ];
        await fs.promises.writeFile(path.join(dir, 'index.ts'), indexFile.join('\n'));
        for (const extraDir of ['TypeScript', 'JavaScript']) {
            let absDir = path.join(this.fileDir, extraDir);
            let extraData = fs.existsSync(absDir);
            if (extraData) {
                await fs.promises.cp(absDir, path.join(dir), { recursive: true });
                break;
            }
        }
        return outputConfig;
    }

    async readSubList(): Promise<LanguageResultList> {
        let list = await this.reader.getModules();
        let resultList: LanguageResultList = [];
        for (const item of list) {
            // python3_12_0 没有ts版本,自己搞oom了,猜测是new token问题
            if (
                item === 'tiny-python' ||
                item === 'python3_12_0' ||
                item === 'csharp/v6' ||
                item === 'python2_7_18' ||
                item === 'python3_13'
            ) {
                continue;
            }
            let instance = new LanguageParser(path.join(this.fileDir, item), [...this.levelList, item], [...this.idList, this.id]);
            instance.setConfigList(this.configList);
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
    configList!: GrammarConfig[];

    constructor(filePath: string) {
        let content = fs.readFileSync(filePath, { encoding: 'utf-8' });
        this.#selector = createCssSelectorForHtmlParser2(content, { xmlMode: true });
    }
    async getId() {
        let selector = await this.#selector;
        let rootProject = selector.queryOne(`project`);
        return selector.queryOne(rootProject, `>artifactId::children(0)`).value;
    }
    async getModules() {
        return (await this.#selector).queryAll(`modules module`).map((item) => (item.children[0] as any).value as string);
    }
    private hookLanguageConfig(config: NonNullable<Awaited<ReturnType<XmlReader['getLanguageConfig']>>>) {
        switch (config.id.toLowerCase()) {
            case 'lua': {
                config.g4List = ['LuaLexer.g4', 'LuaParser.g4'];
                break;
            }
            case 'python3': {
                config.entryPoint = 'file_input';
                config.entryPointList = [config.entryPoint];
                break;
            }
            case 'python2': {
                config.grammarName = 'Python2';
                break;
            }
            case 'nasm': {
                config.LexerName = 'nasm_x86_64_Lexer';
                config.ParserName = 'nasm_x86_64_Parser';
                break;
            }
            default:
                break;
        }

        if (!config.entryPoint) {
            let item = this.configList.find((item) => item.name.toLowerCase() === config?.id.toLowerCase());
            config!.entryPoint = item?.start!;
        }
        return config;
    }
    async getLanguageConfig(id: string) {
        let selector = await this.#selector;
        let rootProject = selector.queryOne(`project`);
        if (unSupportLanguageList.includes(id.toLowerCase())) {
            console.warn(`排除:${id}`);
            return;
        }
        let config = selector.queryOne(rootProject, `build plugin:has(groupId:has([value=org.antlr]))`);
        let dir = selector.queryOne(config, 'configuration sourceDirectory::children(0)');
        let g4List = selector.queryAll(config, `includes include::children(0)`);
        if (!g4List.length) {
            // datalog
            let oneNode = selector.queryOne(config, `grammars::children(0)`);
            if (typeof oneNode?.value === 'string') {
                g4List = [oneNode];
            }
        }
        let config2 = selector.queryOne(rootProject, `build plugin:has(groupId:has([value=com.khubla.antlr]))`);
        // let other = selector.queryOne(rootProject, `build plugin:has(groupId:has([value=org.antlr]))`);
        let realConfig = selector.queryOne(config2, `>configuration`);
        let grammarName!: string;
        let entryPoint!: string;
        let entryPointList!: string[];
        if (realConfig) {
            grammarName = selector.queryOne(config2, '>configuration>grammarName::children(0)')?.value as string;
            entryPoint = selector.queryOne(config2, '>configuration>entryPoint::children(0)')?.value as string;
            entryPointList = [entryPoint];
        }
        if (!entryPoint) {
            entryPointList = [...new Set(selector.queryAll(config2, `executions entryPoint::children(0)`).map((item) => item.value))];
            entryPoint = entryPointList[0];
        }

        let value = {
            id: id,
            dir: dir.value,
            g4List: g4List
                .map((item) => item.value)
                .sort((a, b) => {
                    if (a.includes('Lexer')) {
                        return -1;
                    }
                    return 1;
                }),
            grammarName: grammarName,
            entryPoint: entryPoint,
            entryPointList,
            LexerName: '',
            ParserName: '',
        };
        value = this.hookLanguageConfig(value);

        if (!value.grammarName) {
            let grammarList = [...new Set(selector.queryAll(config2, `executions grammarName::children(0)`).map((item) => item.value))];

            if (grammarList.length === 0) {
                console.warn(`该语言没有语法文件`);
                return;
            }
            if (grammarList.length === 1) {
                value.grammarName = grammarList[0];
            } else {
                throw new Error(`同一个语言出现两个名字:${id}`);
            }
        }
        if (!value.LexerName) {
            value.LexerName = `${value.grammarName}Lexer`;
        }
        if (!value.ParserName) {
            value.ParserName = `${value.grammarName}Parser`;
        }
        value.g4List = value.g4List.filter((item) => item.toLowerCase().startsWith(value.grammarName.toLowerCase()));

        return value;
    }

    async isBuild() {
        return !!(await this.#selector).queryOne(`build plugin:has(groupId:has([value=org.antlr]))`);
    }
    async isDir() {
        return !!(await this.#selector).queryOne(`modules`);
    }
}

main(path.join(process.cwd(), `lib/grammars-v4`));
