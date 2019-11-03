export default function isClass(cls) {
    return (
        (typeof cls === 'function' &&
            /classCallCheck/.test(Function.prototype.toString.call(cls))) ||
        (typeof cls === 'object' &&
            /classCallCheck/.test(Function.prototype.toString.call(cls.__proto__.constructor)))
    )
}
