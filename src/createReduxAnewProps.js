export default function createReduxAnewProps({ name, batches }, reducer) {
    return {
        name,
        reducer,
        getBatches: () => batches,
    }
}
