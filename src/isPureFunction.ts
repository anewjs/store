export default function isPureFunction(func: any): boolean {
    const prototype = Object.getOwnPropertyDescriptor(func, 'prototype')

    return (
        typeof func === 'function' && typeof prototype === 'object' && prototype.writable === true
    )
}
