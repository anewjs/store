import { persistStore } from 'redux-persist'

/**
 * Create persist store as a property inside the redux store
 * @return { Object } Redux Store Object Shape
 */
export default function createPersistStore(persist, reduxStore) {
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
