import { PseudoSelector } from 'css-what';
import { ASTViewNode } from './type';
import nthCheck from 'nth-check';
function nthCompare(value: string, reverse = false) {
    const result = nthCheck(value);
    return (index: number, length: number) => {
        const value = result(reverse ? length - 1 - index : index);
        return value;
    };
}
function firstOne(index: number, length: number) {
    return index === 0;
}
function lastOne(index: number, length: number) {
    return index + 1 === length;
}
function onlyOne(index: number, length: number) {
    return index === 0;
}
/** @internal */
export function pseudoChild<T>(selector: PseudoSelector, list: ASTViewNode<T>[], allList: ASTViewNode<T>[]) {
    let typed = false;
    let indexFn: (index: number, length: number) => boolean;
    switch (selector.name) {
        case 'first-child':
            indexFn = firstOne;
            break;
        case 'last-child':
            indexFn = lastOne;
            break;
        case 'only-child':
            indexFn = onlyOne;
            break;
        case 'nth-child':
            indexFn = nthCompare(selector.data as string);
            break;
        case 'nth-last-child':
            indexFn = nthCompare(selector.data as string, true);
            break;
        case 'first-of-type':
            indexFn = firstOne;
            typed = true;
            break;
        case 'last-of-type':
            indexFn = lastOne;
            typed = true;
            break;
        case 'only-of-type':
            indexFn = onlyOne;
            typed = true;
            break;
        case 'nth-of-type':
            indexFn = nthCompare(selector.data as string);
            typed = true;
            break;
        case 'nth-last-of-type':
            indexFn = nthCompare(selector.data as string, true);
            typed = true;
            break;
        default:
            throw new Error(`pseudo: ${selector.type} not support`);
    }
    return list.filter((item) => {
        const node = item;
        const parentList = (node.parent?.children || (allList as any as ASTViewNode<T>[])).filter((child) =>
            typed ? child.tag === node.tag : true
        );
        const parentLength = parentList.length;
        const nodeIndex = parentList.findIndex((item) => item === node);
        return indexFn(nodeIndex, parentLength);
    });
}
