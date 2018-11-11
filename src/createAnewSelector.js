import { createSelector } from 'reselect'

export default function createAnewSelector(anewStore, reduxStore) {
    return function createAnewSelectorWrapper(...payload) {
        const selector = payload[0]
        const payloadLen = payload.length

        switch (typeof selector) {
            case 'string':
                const propName = selector
                const defaultValue = payload[1]

                function propSelector(state, { [propName]: propValue = defaultValue } = {}) {
                    function propSelectorBinded(
                        state,
                        { [propName]: propValue = defaultValue } = {}
                    ) {
                        return propValue
                    }

                    return {
                        ref: propSelectorBinded,
                        value: propValue,
                    }
                }

                return propSelector
            case 'object':
            case 'function':
                if (payloadLen === 1) {
                    function simpleSelector(...args) {
                        let simpleSelectorBinded

                        if (reduxStore.anew.core) {
                            simpleSelectorBinded = function(...payload) {
                                return selector(
                                    anewStore.state,
                                    reduxStore.anew.core.getState(),
                                    ...payload
                                )
                            }
                        } else {
                            simpleSelectorBinded = function(...payload) {
                                return selector(anewStore.state, ...payload)
                            }
                        }

                        return {
                            ref: simpleSelectorBinded,
                            value: simpleSelectorBinded(...args),
                        }
                    }

                    return simpleSelector
                } else if (payloadLen > 1) {
                    const selector = createSelector(...payload)

                    function memoizedSelector(props) {
                        let memoizedSelectorBinded

                        if (reduxStore.anew.core) {
                            memoizedSelectorBinded = function(props) {
                                return selector(reduxStore.anew.core.getState(), props)
                            }
                        } else {
                            memoizedSelectorBinded = function(props) {
                                return selector(anewStore.state, props)
                            }
                        }

                        return {
                            ref: memoizedSelectorBinded,
                            value: memoizedSelectorBinded(props),
                        }
                    }

                    return memoizedSelector
                }
            default:
                return () => undefined
        }
    }
}
