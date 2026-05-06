export function addData(list: { lang: string[]; ext: string[] }[], addItem: { lang: string[]; ext: string[] }) {
    for (const item of list) {
        if (item.lang.some((item) => addItem.lang.includes(item))) {
            item.lang = [...new Set([...item.lang, ...addItem.lang])];
            item.ext = [...new Set([...item.ext, ...addItem.ext])];
            return;
        }
    }
    list.push(addItem);
}
