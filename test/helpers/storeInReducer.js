import createStore from '../../src/createStore'
import combineStores from '../../src/combineStores'
import fooStore from '../stores/foo'
import barStore from '../stores/bar'

const foo = createStore(fooStore)

export default function createWithStoreInReducer(reducer) {
    const bar = createStore({
        ...barStore,
        reducers: {
            call: () => {
                reducer(foo)

                return barStore.reducers.call()
            },
        },
    })

    const combined = combineStores({
        stores: [foo, bar],
    })

    return bar.dispatch.reducers.call
}
