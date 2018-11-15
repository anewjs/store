import { createStore } from 'redux'
import { persistStore } from 'redux-persist'

/**
 * Create Redux Store with Third Party Extensions
 *
 * @param  {Function}       reducer Reducer Function
 * @param  {Any}            state     Store Initial State
 * @param  {Function}       enhancer  Redux Store Enhancer
 * @param  {Object|Boolean} persist   Persist Conifg
 * @return {Object}         Anew Store Object
 */
export default function createReduxStore(reducer, state, enhancer, persist) {
    const reduxStore = createStore(reducer, state, enhancer)

    if (persist) {
        const persistor = persistStore(reduxStore)
        const { dispatch, getState } = persistor

        reduxStore.persistor = persistor
        reduxStore.getState.persistor = getState
        reduxStore.dispatch.persistor = dispatch
        reduxStore.dispatch.persistor = Object.assign(reduxStore.dispatch.persistor, {
            flush: persistor.flush,
            pause: persistor.pause,
            persist: persistor.flush,
            purge: persistor.purge,
        })
    }

    return reduxStore
}
