import createStore from '../../src/createStore'
import combineStores from '../../src/combineStores'
import fooStore from '../stores/foo'
import barStore from '../stores/bar'

const foo = createStore(fooStore)

export default function createWithStoreInReducer(reducer, effect) {
    const bar = createStore({
        ...barStore,

        reducers: {
            call: (state, result) => {
                reducer(foo, result)

                return barStore.reducers.call()
            },
        },

        effects: {
            call: ({ dispatch }) => {
                dispatch.call(effect(foo))
            },
        },
    })

    const combined = combineStores({
        stores: [foo, bar],
    })

    return effect ? bar.dispatch.effects.call : bar.dispatch.reducers.call
}
