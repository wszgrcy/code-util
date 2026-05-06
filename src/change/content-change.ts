export class Change {
    readonly type: string = 'Change';
    constructor(public start: number, public explain?: string) {}
}
export class InsertChange extends Change {
    readonly type = 'InsertChange';

    constructor(public start: number, public content: string, public direction: 'left' | 'right' = 'left', public explain?: string) {
        super(start, explain);
    }
}
export class DeleteChange extends Change {
    readonly type = 'DeleteChange';

    constructor(public start: number, public length: number, public explain?: string) {
        super(start, explain);
    }
}
export class ReplaceChange extends Change {
    readonly type = 'ReplaceChange';

    constructor(public start: number, public length: number, public content: string, public explain?: string) {
        super(start, explain);
    }
}
