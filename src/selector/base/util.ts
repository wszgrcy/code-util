import { InferData, NodeRange } from './type';

export function isPlainObject(obj: any, level: number = 0): boolean {
    if (level > 20) {
        return false;
    }
    const isPlain = Object.getPrototypeOf(obj) === Object.prototype;
    if (!isPlain) {
        return false;
    }
    for (const key in obj) {
        const type = typeof obj[key];
        if (type === 'function' || type === 'symbol') {
            return false;
        } else if (obj[key] instanceof Array) {
            const result = isPlainArray(obj[key], level + 1);
            if (!result) {
                return false;
            }
        } else if (type === 'object') {
            const result = isPlainObject(obj[key], level + 1);
            if (!result) {
                return result;
            }
        }
    }
    return true;
}
export function isPlainArray(list: any[], level: number = 0) {
    if (level > 20) {
        return false;
    }
    for (const item of list) {
        if (item instanceof Array) {
            const result = isPlainArray(item, level + 1);
            if (!result) {
                return false;
            }
        } else if (typeof item === 'object' && item !== null) {
            const result = isPlainObject(item, level + 1);
            if (!result) {
                return false;
            }
        }
    }
    return true;
}

export function isObject(obj: unknown): obj is Object {
    // The method can't do a type cast since there are type (like strings) which
    // are subclasses of any put not positvely matched by the function. Hence type
    // narrowing results in wrong results.
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !(obj instanceof RegExp) && !(obj instanceof Date);
}
export function safeStringify(obj: any): string {
    const seen = new Set<any>();
    return JSON.stringify(obj, (key, value) => {
        if (isObject(value) || Array.isArray(value)) {
            if (seen.has(value)) {
                return '[Circular]';
            } else {
                seen.add(value);
            }
        }
        return value;
    });
}

export function serializeRefData(data: any) {
    let result;
    try {
        result = safeStringify(data);
    } catch (error) {}
    if (result) {
        return result;
    }
    return data.toString();
}
export function nodeInRange(outRange: NodeRange, inRange: NodeRange) {
    return outRange[0] <= inRange[0] && inRange[1] <= outRange[1];
}
export function inferClone<T>(infer: InferData<T>) {
    const newInfer = {} as InferData<T>;
    for (const key in infer) {
        const element = infer[key];
        if (element instanceof Array) {
            newInfer[key] = element.slice();
        } else {
            newInfer[key] = element;
        }
    }
    return newInfer;
}
