import { expect } from 'chai';
import { createCssSelectorForAntlr4 } from './css-selector-for-antlr4';
import * as fs from 'fs';
import * as path from 'path';
if (process.env.CI !== 'true') {
    const mockData = `body
    {
        color:red;}`;
    //  目前仅用css测试,理论上antlr的所有解析应该都一样
    describe('用于antlr4的css选择器', () => {
        it('初始化', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            expect(cssSelector).to.be.ok;
        });
        it('标签查询', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('selectorGroup');
            expect(result.length).to.eq(1);
            expect(result[0].context!.node.getText().trim()).to.eq('body');
        });

        it('~', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('property_~expr');
            expect(result.length).to.eq(1);
            expect(result[0].value).to.eq('red');
        });
        it('>', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('declaration>property_');
            expect(result.length).to.eq(1);
            expect(result[0].value).to.eq('color');
        });
        it(',', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('property_,expr');
            expect(result.length).to.eq(2);
            expect(result[0].value).to.eq('color');
            expect(result[1].value).to.eq('red');
        });
        it('attribute equal', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('ident[value=red]');
            expect(result.length).to.eq(1);
            expect(result[0].value).to.eq('red');
        });
        it('a b c', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('stylesheet declaration ident');
            expect(result.length).to.eq(2);
            expect(result[0].value).to.eq('color');
            expect(result[1].value).to.eq('red');
        });
        it('定位', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });

            const list = cssSelector.locate([17, 17]);
            expect(list.reverse()[0].node.value).to.eq('red');
        });
        it('查询', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryOne('declaration property_');
            expect(result).to.be.ok;
            expect(result.value).to.eq('color');
        });
        // 不能解析符号,所以antlr中的字面量不可查询
        xit('常量', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryAll('{');
            expect(result).to.be.ok;
        });
        it('属性查询', async () => {
            const cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import('../../antlr/grammars/css3') });
            const result = cssSelector.queryOne('[value=color]');
            expect(result.value).to.eq('color');
        });
        // fit('伪元素', async () => {
        //     let cssSelector = await createCssSelectorForAntlr4(mockData, { loadPackage: import(cssPackage) });
        //     let result = cssSelector.queryOne(`declaration::property_`);
        //     expect(result.value).to.eq('color');
        // });
    });
    describe('通用查询', () => {
        describe('rust', () => {
            it('默认', async () => {
                const s = await createCssSelectorForAntlr4(
                    `fn main(){
                        let a = b.1.2.3.4;
                        let c = 1.2345;
                    }`,
                    { loadPackage: import('../../antlr/grammars/rust') },
                    {}
                );
                const list = s.getAstTree(s.rootNodeList, true);
                expect(list.children.length).to.be.ok;
            });
            it('查询', async () => {
                const s = await createCssSelectorForAntlr4(
                    `fn main(){
                        let a = b.1.2.3.4;
                        let c = 1.2345;
                    }`,
                    { loadPackage: import('../../antlr/grammars/rust') },
                    {}
                );
                const result = s.queryAll('[value=main]');
                expect(result.length).to.be.ok;
            });
            // todo 目前可能是他自己的问题,需要等等
            xit('速度慢', async () => {
                const content = await fs.promises.readFile(path.join(__dirname, './fixture/rust-slow.rs'), { encoding: 'utf-8' });
                const s = await createCssSelectorForAntlr4(content, { loadPackage: import('../../antlr/grammars/rust') }, {});
            });
        });
        describe('golang', () => {
            it('默认', async () => {
                let s = await createCssSelectorForAntlr4(
                    `package samples
    
                    func BodylessFunction()
                    `,
                    { loadPackage: import('../../antlr/grammars/golang') },
                    {}
                );
                let list = s.getAstTree(s.rootNodeList, true);
                expect(list.children.length).to.be.ok;
                s = await createCssSelectorForAntlr4(
                    `package samples
    
                    import "fmt"
                    import "io"
                    import "crypto/md5"
                    import "crypto/sha256"
                    
                    import "golang.org/x/crypto/blake2s"
                    
                    // Trivial routine
                    func WeakHash(a int32) {
                        hMd5 := md5.New()
                        hSha := sha256.New()
                        hBlake2s, err := blake2s.New256(nil)
                        if err == nil {
                            io.WriteString(hMd5, "Welcome to Go Language Secure Coding Practices")
                            io.WriteString(hSha, "Welcome to Go Language Secure Coding Practices")
                            io.WriteString(hBlake2s, "Welcome to Go Language Secure Coding Practices")
                            fmt.Printf("MD5        : %x\n", hMd5.Sum(nil))
                            fmt.Printf("SHA256     : %x\n", hSha.Sum(nil))
                            fmt.Printf("Blake2s-256: %x\n", hBlake2s.Sum(nil))
                        }
                    }
                    `,
                    { loadPackage: import('../../antlr/grammars/golang') },
                    {}
                );
                list = s.getAstTree(s.rootNodeList, true);
                expect(list.children.length).to.be.ok;
            });
            it('查询', async () => {
                const s = await createCssSelectorForAntlr4(
                    `package samples
    
                    func BodylessFunction()`,
                    { loadPackage: import('../../antlr/grammars/golang') },
                    {}
                );
                const result = s.queryAll('[value=BodylessFunction]');
                expect(result.length).to.be.ok;
            });
        });
        describe('java20', () => {
            it('默认', async () => {
                let s = await createCssSelectorForAntlr4(
                    `public class HelloWorld { 
                        public static void main(String[] args) { 
                           System.out.println("Hello, World");
                        }
                     }
                     
                     `,
                    { loadPackage: import('../../antlr/grammars/java/java20') },
                    {}
                );
                let list = s.getAstTree(s.rootNodeList, true);
                expect(list.children.length).to.be.ok;
                s = await createCssSelectorForAntlr4(
                    `module com.example.foo {
                        requires com.example.foo.http;
                        requires java.logging;
                        requires transitive com.example.foo.network;
                        exports com.example.foo.bar;
                        exports com.example.foo.internal to com.example.foo.probe;
                        opens com.example.foo.quux;
                        opens com.example.foo.internal to com.example.foo.network,
                        com.example.foo.probe;
                        uses com.example.foo.spi.Intf;
                        provides com.example.foo.spi.Intf with com.example.foo.Impl;
                    }
                    `,
                    { loadPackage: import('../../antlr/grammars/java/java20') },
                    {}
                );
                list = s.getAstTree(s.rootNodeList, true);
                expect(list.children.length).to.be.ok;
            });
        });
    });
}
