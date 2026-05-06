import inquirer, { prompt } from 'inquirer';

export function inputNumber(hint?: string, validate?: (input: any, answers?: any) => boolean | string | Promise<boolean | string>) {
    return prompt([{ type: 'number', name: 'number', message: hint, validate: validate }]).then((res: { number: number }) => res.number);
}
