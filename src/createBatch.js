import isPlainObject from './isPlainObject'
import ActionTypes from './actionTypes'

export default function createBatch(reduxStore, type) {
    let callReducer

    switch (type) {
        case 'combined':
            callReducer = (payload, { 0: storeName, 1: batchName } = []) => {
                const storeBatch = reduxStore.dispatch.batch[storeName]

                if (!!storeBatch && typeof storeBatch[batchName] === 'function') {
                    storeBatch[batchName](...payload)
                }
            }

            break
        default:
            callReducer = (payload, { 0: longSyntax, 1: shortSyntax } = []) => {
                if (typeof batchBuilder === 'function') {
                    batchBuilder(...payload)
                } else if (longSyntax) {
                    reduxStore.anew.getBatches().push({
                        type: `${longSyntax}:${shortSyntax}`,
                        payload,
                    })
                }
            }

            break
    }

    const batch = function(batches = []) {
        if (isPlainObject(batches)) {
            const { type, payload = [] } = batches
            const data = type.split(':')

            callReducer(payload, data)
        } else {
            for (let i = 0, batchLen = batches.length; i < batchLen; i++) {
                const { type, payload = [] } = batches[i]
                const data = type.split(':')

                callReducer(payload, data)
            }
        }

        return batches
    }

    batch.done = function() {
        const batches = reduxStore.anew.getBatches()
        const { length } = batches

        if (!!length) {
            return reduxStore.dispatch({
                type: ActionTypes.BATCH,
                payload: batches.splice(0, length),
            })
        }
    }

    return batch
}
