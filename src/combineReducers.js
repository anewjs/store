import { persistCombineReducers } from 'redux-persist'
import { combineReducers as reduxCombineReducers } from 'redux'

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
            stores[i] = createStore(store)
        }

        const {
            getState,
            anew: { name, reducer },
        } = storeCreated ? store : stores[i]

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

    return function combination(state = {}, action) {
        switch (action.type) {
            case ActionTypes.BATCH:
                for (let i = 0, payloadLen = action.payload.length; i < payloadLen; i++) {
                    const batchAction = action.payload[i]

                    state = combinedReducer(state, {
                        ...batchAction,
                        state,
                    })
                }
            default:
                state = combinedReducer(state, action)
        }

        return anewStore.setState(state)
    }
}
