import { spawn, spawnSync } from 'child_process';
import path, { join } from 'path';
import * as fs from 'fs';
import fastq from 'fastq';

interface Options {
    /** 用在仓库和默认grammar里面 */
    packageName: string;
    /** 专门的二级目录 */
    prefix?: string;
    /** grammar里的,没有的话用prefix / packageName */
    exportName?: string;
    repo?: string;
    branch?: string;
}
let defaultOptions: Partial<Options> = {
    branch: 'master',
};
async function cloneRepo(cloneMode: boolean) {
    function buildTemplate(options: Options) {
        let { packageName, prefix, exportName, repo, branch } = { ...defaultOptions, ...options };
        repo ??= repo || `https://github.com/tree-sitter/tree-sitter-${packageName}.git`;
        let useName = exportName || prefix || packageName;
        let repoDir = `./temp/tree-sitter/${useName}`;
        let cloneCmd = 'git';
        let cloneArgs = [`clone`, `${repo}`, `--depth`, `1`, `--branch`, `${branch}`, `${repoDir}`];
        if (fs.existsSync(join(process.cwd(), repoDir))) {
            cloneCmd = 'echo';
            cloneArgs = [`'skip clone'`];
        }
        return {
            command: cloneMode
                ? ([[cloneCmd, cloneArgs]] as const)
                : [
                      [cloneCmd, cloneArgs] as const,
                      [
                          `tree-sitter`,
                          [`build`, `${prefix ? repoDir + '/' + prefix : repoDir}`, '-w', '-o', `./lib/tree-sitter/${useName}.wasm`],
                      ] as const,
                  ],
            name: useName,
        };
    }
    let list = [
        buildTemplate({ packageName: 'typescript', prefix: 'typescript' }),
        buildTemplate({ packageName: 'typescript', prefix: 'tsx' }),
        buildTemplate({ packageName: 'html' }),
        buildTemplate({ packageName: 'ada', repo: 'https://github.com/briot/tree-sitter-ada.git' }),
        buildTemplate({ packageName: 'agda' }),
        buildTemplate({ packageName: '', repo: 'https://github.com/aheber/tree-sitter-sfapex.git', prefix: 'sosl', branch: 'main' }),
        buildTemplate({ packageName: '', repo: 'https://github.com/aheber/tree-sitter-sfapex.git', prefix: 'soql', branch: 'main' }),
        buildTemplate({ packageName: '', repo: 'https://github.com/aheber/tree-sitter-sfapex.git', prefix: 'apex', branch: 'main' }),
        // 2023.5
        // buildTemplate({ packageName: '', repo: 'https://github.com/jsuarez-chipiron/tree-sitter-apex.git', prefix: 'apex', branch: 'main' }),
        // 无grammar.json
        // buildTemplate({ packageName: 'eventrule', repo: 'https://github.com/3p3r/tree-sitter-eventrule.git', branch: 'main' }),
        buildTemplate({ packageName: 'bash' }),
        buildTemplate({
            packageName: 'beancount',
            repo: 'https://github.com/zwpaper/tree-sitter-beancount.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'capnp',
            repo: 'https://github.com/amaanq/tree-sitter-capnp.git',
        }),
        buildTemplate({ packageName: 'c' }),
        buildTemplate({ packageName: 'cpp' }),
        buildTemplate({ packageName: 'c-sharp', exportName: 'c_sharp' }),
        buildTemplate({
            packageName: 'cel',
            repo: 'https://github.com/bufbuild/tree-sitter-cel.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'clojure',
            repo: 'https://github.com/sogaiu/tree-sitter-clojure.git',
        }),
        buildTemplate({
            packageName: 'cmake',
            repo: 'https://github.com/uyha/tree-sitter-cmake.git',
        }),
        // 好像慢到oom
        // buildTemplate({
        //     packageName: 'COBOL',
        //     repo: 'https://github.com/yutaro-sakamoto/tree-sitter-cobol.git',
        //     branch: 'main',
        // }),
        buildTemplate({
            packageName: 'commonlisp',
            repo: 'https://github.com/theHamsta/tree-sitter-commonlisp.git',
        }),
        buildTemplate({ packageName: 'css' }),
        buildTemplate({
            packageName: 'cuda',
            repo: 'https://github.com/theHamsta/tree-sitter-cuda.git',
        }),
        buildTemplate({
            packageName: 'dart',
            repo: 'https://github.com/UserNobody14/tree-sitter-dart.git',
        }),

        buildTemplate({
            packageName: 'd',
            repo: 'https://github.com/gdamore/tree-sitter-d.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'dockerfile',
            repo: 'https://github.com/camdencheek/tree-sitter-dockerfile.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'dot',
            repo: 'https://github.com/rydesun/tree-sitter-dot.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'elixir',
            repo: 'https://github.com/elixir-lang/tree-sitter-elixir.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'elm',
            repo: 'https://github.com/elm-tooling/tree-sitter-elm.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'elisp',
            repo: 'https://github.com/Wilfred/tree-sitter-elisp.git',
            branch: 'main',
        }),
        //This external scanner uses a symbol that isn't available to Wasm parsers.
        // buildTemplate({
        //     packageName: 'eno',
        //     repo: 'https://github.com/eno-lang/tree-sitter-eno.git',
        //     branch: 'main',
        // }),
        buildTemplate({ packageName: 'embedded-template', exportName: 'embedded_template' }),

        buildTemplate({
            packageName: 'erlang',
            repo: 'https://github.com/WhatsApp/tree-sitter-erlang.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'fennel',
            repo: 'https://github.com/TravonteD/tree-sitter-fennel.git',
        }),
        buildTemplate({
            packageName: 'fish',
            repo: 'https://github.com/ram02z/tree-sitter-fish.git',
        }),
        buildTemplate({
            packageName: 'formula',
            repo: 'https://github.com/siraben/tree-sitter-formula.git',
        }),
        buildTemplate({
            packageName: 'fortran',
            repo: 'https://github.com/stadelmanma/tree-sitter-fortran.git',
        }),
        buildTemplate({
            packageName: 'gitattributes',
            repo: 'https://github.com/ObserverOfTime/tree-sitter-gitattributes.git',
        }),
        buildTemplate({
            packageName: 'gitignore',
            repo: 'https://github.com/shunsambongi/tree-sitter-gitignore.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'gleam',
            repo: 'https://github.com/gleam-lang/tree-sitter-gleam.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'glsl',
            repo: 'https://github.com/theHamsta/tree-sitter-glsl.git',
        }),
        buildTemplate({ packageName: 'go' }),

        buildTemplate({
            packageName: 'gomod',
            repo: 'https://github.com/camdencheek/tree-sitter-go-mod.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'gowork',
            repo: 'https://github.com/omertuc/tree-sitter-go-work.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'graphql',
            repo: 'https://github.com/bkegley/tree-sitter-graphql.git',
        }),
        buildTemplate({
            packageName: 'hack',
            repo: 'https://github.com/slackhq/tree-sitter-hack.git',
            branch: 'main',
        }),
        buildTemplate({ packageName: 'haskell' }),

        buildTemplate({
            packageName: 'hcl',
            repo: 'https://github.com/MichaHoffmann/tree-sitter-hcl.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-ispc.git',
            exportName: 'ispc',
        }),
        buildTemplate({ packageName: 'java' }),
        buildTemplate({ packageName: 'javascript' }),

        buildTemplate({
            packageName: 'jq',
            repo: 'https://github.com/flurie/tree-sitter-jq.git',
            branch: 'main',
        }),
        buildTemplate({ packageName: 'json' }),

        buildTemplate({
            packageName: 'json5',
            repo: 'https://github.com/Joakker/tree-sitter-json5.git',
        }),
        // 慢,内存大
        // buildTemplate({ packageName: 'julia' }),

        buildTemplate({
            packageName: 'just',
            repo: 'https://github.com/IndianBoy42/tree-sitter-just.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: 'kotlin',
            repo: 'https://github.com/fwcd/tree-sitter-kotlin.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'lalrpop',
            repo: 'https://github.com/traxys/tree-sitter-lalrpop.git',
        }),
        //no such file or directory: 'parser.c'
        // buildTemplate({
        //     packageName: 'latex',
        //     repo: 'https://github.com/latex-lsp/tree-sitter-latex.git',
        // }),
        buildTemplate({
            packageName: 'lean',
            repo: 'https://github.com/Julian/tree-sitter-lean.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: 'llvm_mir',
            repo: 'https://github.com/Flakebi/tree-sitter-llvm-mir.git',
        }),
        // 慢 内存大
        buildTemplate({
            packageName: 'llvm',
            repo: 'https://github.com/benwilliamgraham/tree-sitter-llvm.git',
            branch: 'main',
        }),
        // grammar
        // buildTemplate({
        //     packageName: 'mlir',
        //     repo: 'https://github.com/artagnon/tree-sitter-mlir.git',
        // }),
        buildTemplate({
            packageName: 'tablegen',
            repo: 'https://github.com/Flakebi/tree-sitter-tablegen.git',
        }),
        buildTemplate({
            packageName: 'lua',
            repo: 'https://github.com/Azganoth/tree-sitter-lua.git',
        }),
        // grammar.json
        // buildTemplate({
        //     packageName: 'magik',
        //     repo: 'https://github.com/krn-robin/tree-sitter-magik.git',
        //     branch: 'main',
        // }),
        buildTemplate({
            packageName: 'make',
            repo: 'https://github.com/alemuller/tree-sitter-make.git',
            branch: 'main',
        }),
        // 时间长不更新避免重命名问题
        // buildTemplate({
        //     packageName: 'markdown',
        //     repo: 'https://github.com/ikatyang/tree-sitter-markdown.git',
        // }),

        buildTemplate({
            packageName: 'markdown',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-markdown.git',
            prefix: 'tree-sitter-markdown',
            exportName: 'markdown',
            branch: 'split_parser',
        }),
        buildTemplate({
            packageName: 'markdown',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-markdown.git',
            prefix: 'tree-sitter-markdown-inline',
            exportName: 'markdown_inline',
            branch: 'split_parser',
        }),
        // 新一点
        buildTemplate({
            packageName: 'meson',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-meson.git',
        }),
        // buildTemplate({
        //     packageName: 'meson',
        //     repo: 'https://github.com/staysail/tree-sitter-meson.git',
        //     branch: 'main',
        // }),
        buildTemplate({
            packageName: 'm68k',
            repo: 'https://github.com/grahambates/tree-sitter-m68k.git',
        }),
        buildTemplate({
            packageName: 'nix',
            repo: 'https://github.com/nix-community/tree-sitter-nix.git',
        }),
        buildTemplate({
            packageName: 'noir',
            repo: 'https://github.com/hhamud/tree-sitter-noir.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'objc',
            repo: 'https://github.com/jiyee/tree-sitter-objc.git',
            branch: 'main',
        }),
        // todo 等待修复
        // 路径 grammars
        buildTemplate({ packageName: 'ocaml', prefix: 'grammars/ocaml' }),
        buildTemplate({ packageName: 'ocaml', prefix: 'grammars/interface', exportName: 'ocaml_interface' }),
        buildTemplate({
            packageName: 'odin',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-odin.git',
        }),
        buildTemplate({
            packageName: 'ohm',
            repo: 'https://github.com/novusnota/tree-sitter-ohm.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'org',
            repo: 'https://github.com/milisims/tree-sitter-org.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'p4',
            branch: 'main',
            repo: 'https://github.com/ace-design/tree-sitter-p4.git',
        }),
        buildTemplate({
            packageName: 'pascal',
            repo: 'https://github.com/Isopod/tree-sitter-pascal.git',
        }),
        // 下面维护了两个仓库,再加上时间比较近
        buildTemplate({
            packageName: 'perl',
            repo: 'https://github.com/ganezdragon/tree-sitter-perl.git',
        }),
        // 这个没有grammar.json
        // buildTemplate({
        //     packageName: 'perl',
        //     repo: 'https://github.com/tree-sitter-perl/tree-sitter-perl.git',
        // }),
        // grammar.json
        // buildTemplate({
        //     packageName: 'pod',
        //     repo: 'https://github.com/tree-sitter-perl/tree-sitter-pod.git',
        //     branch: 'main',
        // }),
        // buildTemplate({
        //     packageName: 'pgn',
        //     repo: 'https://github.com/rolandwalker/tree-sitter-pgn.git',
        // }),
        //todo 等待修改
        buildTemplate({ packageName: 'php', prefix: 'php' }),
        buildTemplate({ packageName: 'php', prefix: 'php_only' }),
        buildTemplate({
            packageName: 'pgn',
            repo: 'https://github.com/rolandwalker/tree-sitter-pgn.git',
        }),
        // grammar.json
        // buildTemplate({
        //     packageName: 'PowerShell',
        //     repo: 'https://github.com/PowerShell/tree-sitter-PowerShell.git',
        // }),
        buildTemplate({ packageName: 'python' }),

        buildTemplate({
            packageName: 'proto',
            repo: 'https://github.com/mitchellh/tree-sitter-proto.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'qmljs',
            repo: 'https://github.com/yuja/tree-sitter-qmljs.git',
        }),
        buildTemplate({
            packageName: 'quakec',
            repo: 'https://github.com/vkazanov/tree-sitter-quakec.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'racket',
            repo: 'https://github.com/6cdh/tree-sitter-racket.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: 'rasi',
            repo: 'https://github.com/Fymyte/tree-sitter-rasi.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 're2c',
            repo: 'https://github.com/alemuller/tree-sitter-re2c.git',
            branch: 'main',
        }),
        buildTemplate({ packageName: 'regex' }),

        buildTemplate({
            packageName: 'rego',
            repo: 'https://github.com/FallenAngel97/tree-sitter-rego.git',
        }),
        buildTemplate({
            packageName: 'rst',
            repo: 'https://github.com/stsewd/tree-sitter-rst.git',
        }),

        buildTemplate({
            packageName: 'r',
            repo: 'https://github.com/r-lib/tree-sitter-r.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: 'robot',
            repo: 'https://github.com/Hubro/tree-sitter-robot.git',
        }),
        buildTemplate({ packageName: 'ruby' }),
        buildTemplate({ packageName: 'rust' }),
        buildTemplate({ packageName: 'scala' }),

        buildTemplate({
            packageName: 'scheme',
            repo: 'https://github.com/6cdh/tree-sitter-scheme.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'scss',
            repo: 'https://github.com/serenadeai/tree-sitter-scss.git',
        }),
        buildTemplate({
            packageName: 'sexp',
            repo: 'https://github.com/AbstractMachinesLab/tree-sitter-sexp.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'smali',
            repo: 'https://github.com/amaanq/tree-sitter-smali.git',
        }),
        buildTemplate({
            packageName: 'sourcepawn',
            repo: 'https://github.com/nilshelmig/tree-sitter-sourcepawn.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'sparql',
            repo: 'https://github.com/BonaBeavis/tree-sitter-sparql.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/takegue/tree-sitter-sql-bigquery.git',
            exportName: 'sql_bigquery',
            branch: 'main',
        }),
        // buildTemplate({
        //     packageName: '',
        //     repo: 'https://github.com/DerekStride/tree-sitter-sql.git',
        //     exportName: 'sql',
        //     branch: 'main',
        // }),
        // 能否重命名?
        // buildTemplate({
        //     packageName: '',
        //     repo: 'https://github.com/m-novikov/tree-sitter-sql.git',
        //     exportName: 'sql',
        //     branch: 'main',
        // }),

        buildTemplate({
            packageName: 'sqlite',
            repo: 'https://github.com/dhcmrlchtdj/tree-sitter-sqlite.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/metio/tree-sitter-ssh-client-config.git',
            branch: 'main',
            exportName: 'ssh_client_config',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/madskjeldgaard/tree-sitter-supercollider.git',
            branch: 'main',
            exportName: 'supercollider',
        }),
        buildTemplate({
            packageName: 'svelte',
            repo: 'https://github.com/Himujjal/tree-sitter-svelte.git',
        }),
        // 很久没更新
        // buildTemplate({ packageName: 'swift' }),
        // grammar.json
        // buildTemplate({
        //     packageName: 'swift',
        //     repo: 'https://github.com/alex-pinkus/tree-sitter-swift.git',
        //     branch: 'main',
        // }),
        // grammar.json
        // buildTemplate({
        //     packageName: 'systemrdl',
        //     repo: 'https://github.com/SystemRDL/tree-sitter-systemrdl.git',
        // }),
        buildTemplate({
            packageName: 'thrift',
            repo: 'https://github.com/duskmoon314/tree-sitter-thrift.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: 'comment',
            repo: 'https://github.com/stsewd/tree-sitter-comment.git',
        }),
        buildTemplate({ packageName: 'toml' }),

        buildTemplate({
            packageName: 'query',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-query.git',
        }),
        buildTemplate({
            packageName: 'turtle',
            repo: 'https://github.com/BonaBeavis/tree-sitter-turtle.git',
            branch: 'main',
        }),
        // https://github.com/kaermorchen/tree-sitter-twig.git
        buildTemplate({
            packageName: 'twig',
            repo: 'https://github.com/gbprod/tree-sitter-twig.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: 'ungrammar',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-ungrammar.git',
            branch: 'main',
        }),

        buildTemplate({
            packageName: '',
            repo: 'https://github.com/ColinKennedy/tree-sitter-usd.git',
            exportName: 'usd',
        }),

        buildTemplate({ packageName: 'verilog' }),

        buildTemplate({
            packageName: 'vhdl',
            repo: 'https://github.com/alemuller/tree-sitter-vhdl.git',
            branch: 'main',
        }),
        // This external scanner uses a symbol that isn't available to Wasm parsers.
        // buildTemplate({
        //     packageName: 'vue',
        //     repo: 'https://github.com/ikatyang/tree-sitter-vue.git',
        // }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/wasm-lsp/tree-sitter-wasm.git',
            prefix: 'wat',
            exportName: 'wat',
            branch: 'main',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/wasm-lsp/tree-sitter-wasm.git',
            prefix: 'wast',
            exportName: 'wast',
            branch: 'main',
        }),
        //This external scanner uses a symbol that isn't available to Wasm parsers.
        // buildTemplate({
        //     packageName: '',
        //     repo: 'https://github.com/jdidion/tree-sitter-wdl.git',
        //     branch: 'main',
        //     exportName: 'wdl',
        // }),
        buildTemplate({
            packageName: 'wgsl',
            repo: 'https://github.com/mehmetoguzderin/tree-sitter-wgsl.git',
            branch: 'main',
        }),
        // This external scanner uses a symbol that isn't available to Wasm parsers.
        // buildTemplate({
        //     packageName: 'yaml',
        //     repo: 'https://github.com/ikatyang/tree-sitter-yaml.git',
        // }),
        buildTemplate({
            packageName: 'yang',
            repo: 'https://github.com/Hubro/tree-sitter-yang.git',
        }),
        buildTemplate({
            packageName: '',
            exportName: 'zig',
            repo: 'https://github.com/maxxnino/tree-sitter-zig.git',
            branch: 'main',
        }),
        buildTemplate({
            packageName: '',
            repo: 'https://github.com/tree-sitter-grammars/tree-sitter-yuck.git',
            branch: 'main',
            exportName: 'yuck',
        }),

        //d fortran lalrpop lean racket sql_bigquery svelte vue yaml 使用 0.20.8

        buildTemplate({ packageName: 'jsdoc' }),
        buildTemplate({ packageName: 'tsq', branch: 'main' }),

        buildTemplate({ packageName: 'ql-dbscheme', exportName: 'dbscheme', branch: 'main' }),
        buildTemplate({ packageName: 'ql' }),
        buildTemplate({ packageName: 'fluent' }),
    ];

    let { $ } = await import('execa');
    let errorList: any[] = [];
    async function buildGrammar(item: ReturnType<typeof buildTemplate>) {
        let a = Date.now();
        console.log('准备执行', item.name, item.command);
        let warn = setInterval(() => {
            console.log('执行缓慢:', item.name, item.command);
        }, 60 * 1000);
        for (const commandItem of item.command) {
            let result = await $({ stdio: 'inherit', reject: false })(commandItem[0], commandItem[1]);
            result;
            if (result.failed) {
                console.log(`执行失败:${commandItem};${result.stderr}`);
                errorList.push(commandItem);
            }
        }
        console.log(`${item.name}:用时${(Date.now() - a) / 1000}`);
        clearInterval(warn);
    }

    console.log('语法1长度', list.length);

    const firstItem = list[0];
    await buildGrammar(firstItem);
    if (errorList.length > 0) {
        throw new Error(`首个任务执行失败:${JSON.stringify(errorList)}`);
    }
    const languageList = [firstItem.name];

    const q = fastq.promise(buildGrammar, 4);
    let waitList: Promise<any>[] = [];
    for (const item of list.slice(1)) {
        waitList.push(q.push(item));
        languageList.push(item.name);
    }
    await Promise.all(waitList);

    console.log('执行完1');
    if (errorList.length) {
        throw new Error(`未全部执行成功:${JSON.stringify(errorList)}`);
    }
    //! 执行速度太慢,甚至死机崩溃
    // const q2 = fastq.promise(buildGrammar, 1);
    // let runOneList = [
    //     // buildTemplate({ packageName: 'julia' }),
    //     buildTemplate({
    //         packageName: 'llvm',
    //         repo: 'https://github.com/benwilliamgraham/tree-sitter-llvm.git',
    //         branch: 'main',
    //     }),
    //     buildTemplate({
    //         packageName: 'perl',
    //         repo: 'https://github.com/ganezdragon/tree-sitter-perl.git',
    //     }),
    //     buildTemplate({
    //         packageName: 'sql',
    //         repo: 'https://github.com/m-novikov/tree-sitter-sql.git',
    //         branch: 'main',
    //     }),
    // ].map((item) => q2.push(item));
    // console.log('语法2长度', runOneList.length);

    // await Promise.all(runOneList);
    // console.log('执行完2');
    fs.writeFileSync(path.join(process.cwd(), 'lib/tree-sitter', 'manifest.json'), JSON.stringify(languageList));
}
cloneRepo(false);
