import { persistReducer } from 'redux-persist'

import { PERSIST, REHYDRATE, PREFIX, RESET, BATCH } from './actionTypes'
import composeReducers from './composeReducers'
import createPersistConfig from './createPersistConfig'
import toAnewAction from './toAnewAction'

export default function createReducer(anewStore, userReducer, persist) {
    const { name, state: initalState } = anewStore
    const baseReducer = (reduxState, { type = '', payload = [], state: globalState = {} } = {}) => {
        const action = toAnewAction(type)
        const storeName = action[0]
        const reducerName = action[1]

        switch (storeName) {
            case PREFIX:
                switch (reducerName) {
                    case RESET:
                        anewStore.state = initalState

                        break
                    case BATCH:
                        for (let i = 0, payloadLen = payload.length; i < payloadLen; i++) {
                            reducer(reduxState, payload[i])
                        }

                        break
                }
            case PERSIST:
                switch (reducerName) {
                    case REHYDRATE:
                        anewStore.setState(payload[name])

                        break
                }
            default:
                const isStore = name === storeName
                const currentReducer = isStore ? anewStore.reducers : anewStore.reducers[storeName]

                if (!!currentReducer && typeof currentReducer[reducerName] === 'function') {
                    return anewStore.setState(
                        currentReducer[reducerName](
                            anewStore.state,
                            ...(!isStore ? [globalState[storeName], ...payload] : payload)
                        )
                    )
                }

                break
        }

        return anewStore.state
    }

    return composeReducers(
        anewStore,
        persist ? persistReducer(createPersistConfig(persist, name), baseReducer) : baseReducer,
        userReducer
    )
}
