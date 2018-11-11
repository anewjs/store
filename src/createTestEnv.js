import ActionTypes from './actionTypes'

export default function createTestEnv(store) {
    return function createStore() {
        store.dispatch({ type: ActionTypes.RESET })

        return store
    }
}
