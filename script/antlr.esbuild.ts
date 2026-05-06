import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'glob';
// antlr构建
async function main() {
    await esbuild.build({
        bundle: true,
        entryPoints: glob.sync('src/antlr/grammars/**/index.ts').map((item) => {
            return { in: item, out: path.relative(path.join(process.cwd(), 'src/antlr'), item).replace(/\.ts$/, '') };
        }),
        outdir: path.join(process.cwd(), 'temp/antlr'),
        format: 'esm',
        keepNames: true,
        minify: true,
        splitting: true,
        tsconfig: 'tsconfig.build-antlr-parser.json',
        // outExtension: { '.js': '.mjs' },
    });
    await esbuild.build({
        // bundle: true,
        entryPoints: glob.sync('temp/antlr/**/*.js').map((item) => {
            return { in: item, out: path.relative(path.join(process.cwd(), 'temp/antlr'), item).replace(/\.js$/, '') };
        }),
        outdir: path.join(process.cwd(), 'packages/antlr'),
        format: 'cjs',
        keepNames: true,
        minify: true,
        outExtension: { '.js': '.js' },
    });
}
main();
