import { prompt } from 'inquirer';

export function inputText(
    hint?: string,
    validate?: (input: any, answers?: any) => boolean | string | Promise<boolean | string>
): Promise<string> {
    return prompt([{ type: 'input', name: 'input', message: hint, validate: validate }]).then((res: { input: string }) => res.input);
}
