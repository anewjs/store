import { persistCombineReducers } from 'redux-persist'
import { combineReducers as reduxCombineReducers } from 'redux'
import invariant from 'invariant'

import ActionTypes from './actionTypes'
import createPersistConfig from './createPersistConfig'
import createStore from './createStore'
import isStoreCreated from './isStoreCreated'

export default function combineReducers(anewStore, stores, persist) {
    /**
     * Populate/Combine State and Reducers
     */
    stores.forEach((store, i) => {
        const storeCreated = isStoreCreated(store)

        if (!storeCreated) {
            invariant(
                typeof store === 'object',
                `No store provided for index "${i}" in the combined store "${anewStore.name}"`
            )

            store = stores[i] = createStore(store)
        }

        const {
            getState,
            anew: { name, reducer },
        } = store

        anewStore.state[name] = getState()
        anewStore.reducers[name] = reducer
    })

    persist = createPersistConfig(persist, anewStore.name)

    /**
     * Reduce State then return anewStore reference
     */
    const combinedReducer = persist
        ? persistCombineReducers(persist, anewStore.reducers)
        : reduxCombineReducers(anewStore.reducers)

    return function combination(state, action) {
        const { type, payload } = action

        switch (type) {
            case ActionTypes.BATCH:
                payload.forEach(batch => {
                    state = combinedReducer(state, {
                        ...batch,
                        state,
                    })
                })

                break
            default:
                state = combinedReducer(state, { ...action, state })

                break
        }

        return anewStore.setState(state)
    }
}
