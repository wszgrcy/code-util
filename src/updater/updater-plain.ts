import { Change, DeleteChange, InsertChange, ReplaceChange } from '../change/content-change';
import MagicString from 'magic-string';

export class UpdaterPlain {
    static update(content: string, list: Change[]) {
        const ms = new MagicString(content);
        for (const changeItem of list) {
            if (changeItem instanceof ReplaceChange) {
                ms.update(changeItem.start, changeItem.start + changeItem.length, changeItem.content);
            } else if (changeItem instanceof InsertChange) {
                if (changeItem.direction === 'left') {
                    ms.appendLeft(changeItem.start, changeItem.content);
                } else {
                    ms.appendRight(changeItem.start, changeItem.content);
                }
            } else if (changeItem instanceof DeleteChange) {
                ms.remove(changeItem.start, changeItem.start + changeItem.length);
            }
        }
        return ms.toString();
    }
}
