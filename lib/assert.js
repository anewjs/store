export default function assert(condition, msg) {
  if (!condition) throw new Error("[@anew] " + msg);
}