export default function isPureFunction(func) {
    return (
        typeof func === 'function' &&
        func.__proto__.constructor.toString() === 'function Function() { [native code] }'
    )
}
