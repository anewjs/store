export default function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`[@anew] ${msg}`)
}
