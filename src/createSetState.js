import isPlainObject from './isPlainObject'

export default function createSetState(anewStore) {
    if (isPlainObject(anewStore.state)) {
        /**
         * Clean up state tree
         * if is es module
         */
        if (anewStore.state.__esModule) {
            const { __esModule, ...state } = anewStore.state

            anewStore.state = state
        }

        return function setState(stateChange) {
            if (!!stateChange && stateChange !== anewStore.state) {
                anewStore.state = {
                    ...anewStore.state,
                    ...stateChange,
                }
            }

            return anewStore.state
        }
    }

    return function setState(stateChange) {
        if (!!stateChange && stateChange !== anewStore.state) {
            anewStore.state = stateChange
        }

        return anewStore.state
    }
}
