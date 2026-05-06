import { selectOption } from './select-option';
import * as inquirer from 'inquirer';
import * as readline from 'readline';
import { inputText } from './input-text';
import { inputNumber } from './input-number';
function hookPrompt() {
    const ui = inquirer.ui;
    const Prompt = ui.Prompt;
    let currentRl: readline.Interface;
    ui.Prompt = class Hook extends Prompt {
        constructor(...args: any[]) {
            super(args[0], args[1]);
            currentRl = this.rl;
        }
    } as any;
    return {
        getCurrentRl: () => currentRl,
        reset: () => {
            ui.Prompt = Prompt;
        },
    };
}

describe('交互', () => {
    const hookGroup = hookPrompt();
    let rl: readline.Interface;

    it('选项', (done) => {
        hookPrompt();
        const result = selectOption(
            [
                { label: 't1', value: 'an1' },
                { label: 't2', value: 'an2' },
            ],
            '请选择选项'
        );
        result.then((res) => {
            expect(res).to.eq('an1');
            done();
            rl.close();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line');
    });
    it('输入文本', (done) => {
        const input = 'abcd';
        inputText('输入文本').then((value) => {
            expect(value).to.eq(input);
            done();
            rl.close();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line', input);
    });
    it('输入文本:验证', (done) => {
        inputText('输入文本:验证', (input, answers) => input.length < 4).then((value) => {
            expect(value).to.eq('abc');
            done();
            rl.close();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line', 'abcd');
        setTimeout(() => {
            rl.emit('line', 'abc');
        }, 0);
    });
    it('输入数字', (done) => {
        const input = 12345;
        inputNumber('输入数字').then((value) => {
            expect(typeof value).to.eq('number');
            expect(value).to.eq(input);
            done();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line', '12345');
        rl.close();
    });
    it('输入非数字', (done) => {
        const input = 'asdf';
        inputNumber('输入数字').then((value) => {
            expect(Number.isNaN(value)).to.be.true;
            done();
            rl.close();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line', input);
    });
    it('输入数字:验证', (done) => {
        const input = 'asdf';
        inputNumber('输入数字:验证', (input, answer) => !Number.isNaN(input)).then((value) => {
            expect(Number.isNaN(value)).not.to.be.true;
            done();
            rl.close();
        });
        rl = hookGroup.getCurrentRl();
        rl.emit('line', input);
        setTimeout(() => {
            rl.emit('line', '123456');
        }, 0);
    });
    afterAll(() => {
        hookGroup.reset();
    });
});
