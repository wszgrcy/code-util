import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'glob';
// 发布之前构建
async function main() {
    let inputCwd = path.join(process.cwd(), './src/selector');
    let options: esbuild.BuildOptions = {
        bundle: true,
        entryPoints: [
            { in: './src/index.ts', out: './index' },
            ...glob.sync('./**/index.ts', { cwd: inputCwd }).map((item) => {
                return { in: path.join(inputCwd, item), out: path.join('selector', item.slice(0, -3)) };
            }),
            { in: './src/change', out: './change/index' },
            { in: './src/updater', out: './updater/index' },
        ],
        splitting: true,
        outdir: path.join(process.cwd(), '/dist'),
        format: 'esm',
        keepNames: false,
        sourcemap: true,
        packages: 'external',
        // minify: true,
        tsconfig: 'tsconfig.build.json',
    };
    await esbuild.build(options);
}
main();
