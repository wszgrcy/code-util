import { prompt } from 'inquirer';

export function selectOption<T>(options: { label: string; value: T }[], hint: string = ''): Promise<T> {
    return prompt([
        {
            type: 'list',
            name: 'list',
            message: hint,
            choices: options.map((option, i) => ({ name: option.label, value: i })),
        },
    ]).then((res: { list: number }) => options[res['list']].value);
}
