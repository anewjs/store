import ActionTypes from './actionTypes'

export default function createBatchMiddleware(getBatches) {
    return function batchMiddleware({ dispatch }) {
        return next => action => {
            const batches = getBatches()
            const len = batches.length

            if (action && action.type !== ActionTypes.BATCH && !!len) {
                dispatch({
                    type: ActionTypes.BATCH,
                    payload: batches.splice(0, len),
                })
            }

            return next(action)
        }
    }
}
