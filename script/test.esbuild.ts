import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'glob';

async function main() {
    let options: esbuild.BuildOptions = {
        platform: 'node',
        sourcemap: 'linked',
        bundle: true,
        entryPoints: [
            ...glob.sync('./src/**/*.spec.ts', {}).map((item) => {
                return { in: item, out: path.join('', item.slice(0, -3)) };
            }),
        ],
        splitting: true,
        outdir: path.join(process.cwd(), './test-dist'),
        outExtension: {
            '.js': '.mjs',
        },
        format: 'esm',
        // minify: true,
        tsconfig: 'tsconfig.spec.json',
        charset: 'utf8',
        external: [
            'css-what',
            'css-tree',
            '@lezer/common',
            '@lezer/lr',
            'pgsql-ast-parser',
            'typescript',
            '@angular/compiler',
            'htmlparser2',
            'domhandler',
            'jsonc-parser',
            'nth-check',
            '@vue/compiler-dom',
            'web-tree-sitter',
            'chai',
            '@lezer/rust',
            'magic-string',
            'chevrotain',
            'antlr4',
            'yaml',
        ],
    };
    await esbuild.build(options);
}
main();
