# cyia-code-util

## 使用

- selector 目前对 `ts` `html` `json` 的文件使用 css 选择器返回相关 token(保留文件相关参数)
- interactive 相关选择交互

## 代码覆盖率

| File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| --------------------------- | ------- | -------- | ------- | ------- | ----------------- |
| All files                   | 97.68   | 94.09    | 97.5    | 97.45   |
| src/change                  | 98.29   | 92       | 96.77   | 98.13   |
| content-change.ts           | 100     | 100      | 100     | 100     |
| html-change.ts              | 95.83   | 88.88    | 100     | 95.65   | 29                |
| json-change.ts              | 94.73   | 100      | 87.5    | 94.44   | 13                |
| ts-change.ts                | 100     | 91.22    | 100     | 100     | 19,31,57,85,88    |
| src/interactive             | 100     | 0        | 100     | 100     |
| input-number.ts             | 100     | 100      | 100     | 100     |
| input-text.ts               | 100     | 100      | 100     | 100     |
| select-option.ts            | 100     | 0        | 100     | 100     | 3                 |
| src/selector                | 97.45   | 96.06    | 97.4    | 97.18   |
| css-selector-base.ts        | 98.47   | 97.33    | 100     | 98.3    | 77,181            |
| css-selector-for-html.ts    | 100     | 100      | 100     | 100     |
| css-selector-for-json.ts    | 95.65   | 87.5     | 100     | 95      | 28                |
| css-selector-for-ng-html.ts | 94.73   | 96.42    | 93.33   | 94.2    | 90,100,111,128    |
| css-selector-for-ts.ts      | 100     | 100      | 100     | 100     |
| index.ts                    | 100     | 100      | 100     | 100     |
| src/util                    | 83.33   | 50       | 100     | 83.33   |
| index.ts                    | 100     | 100      | 100     | 100     |
| load-esm-module.ts          | 80      | 50       | 100     | 80      | 7                 |
| test/updater                | 100     | 93.33    | 100     | 100     |
| updater.test.ts             | 100     | 93.33    | 100     | 100     | 16                |

## 破坏性变更

### 1.5.0

- 升级了 angular/compiler,由于此包为 esm 格式,所以依赖此包的`createCssSelectorForNgHtml`,`createCssSelectorForHtml`变成了异步
- 没有将本包也同步修改为 esm 的原因是本包多使用于 node 中,而目前来说 commonjs 还是默认的运行首选,所以为了使用方便,不做大的修改,还是做了兼容处理

## antrl 支持

- 安装环境 antrl
- 使用命令转换为 ts 语法
  > 一般是两个文件,需要转换
  > 还有可能是有 base 文件
- 找到调用根(一般为 EOF?)
- 写脚本.找到树
- 实现树

### 额外文件

- 有一些选项还有额外的 base 需要支持
- 分离编译,antlr 中是不需要 dts 的,同时也只需要一种类型,不需要 apf,直接 commonjs

### 通用节点

- 所有节点转换为通用节点
- 原始节点的数据如何访问?

# todo

- 伪类不能单独使用,需要先有其他查询
- :first-child
  > 父元素的第一个子元素/兄弟元素的第一个子元素
- :first-of-type
  > 兄弟元素中第一个类型,需要先确定
- :last-child
- :last-of-type
- :nth-child
  > an+b 最小是 1
- :nth-last-child()
- :nth-last-of-type
- :nth-of-type
- :only-child 只有自身
- :only-of-type
  > 这里需要定义选择的元素父级

# 改打包

- 可以改成 mjs,触发摇树
- 不用剥离,使用 copy 复制过去,然后依赖加上 antlr

# 速度

- antlr 的解析速度慢,看看怎么回事

# lezer

- 目前这个是通用的,可以全部接入

# 只用通用

- 移除普通版本,改通用
- 上下文移除,因为视图节点已经有了
- ::parent 增加
- 是否有可能出现节点重复

# todo

## tree-sitter

- 需要调研 wasm node 调用
- 好像还是要自编译
- vscode-l10n 有调用
- 需要改测试,因为目前 jasmine 好像不支持 import...(不过 vscode 也不支持真 import,所以可能有坑)
- 可以传路径或者是二进制文件.
- 可以打包一个二进制包,然后使用 jsdelivr 引用他
  > https://cdn.jsdelivr.net/npm/tree-sitter-wasm-bundle@0.0.1/{{name}}.wasm
- 或者直接下载,然后指定路径

## 伪元素

- queryChildren
  > 用来查上级的子级结果索引

父级列表

- 文件名后缀
- 伪元素的 infer 会不会获得?
- 外部,内部 like 一次性会查很多

# 文档

- cli 和 vscode 都只写如何调用,然后再写两种脚本 js/ts/yaml
- 介绍 3 中文件层
- 文件层中的一些逻辑
