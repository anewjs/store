import { applyMiddleware as defaultApplyMiddleware } from 'redux'

import ActionTypes from './actionTypes'
import defaultCombineReducers from './combineReducers'
import defaultCreateBatch from './createBatch'
import defaultCreateBatchMiddleware from './createBatchMiddleware'
import defaultCreateReduxAnewProps from './createReduxAnewProps'
import defaultCreateReduxStore from './createReduxStore'
import defaultCreateSetState from './createSetState'
import invariantFunctionProperty from './invariantFunctionProperty'

export default function combineStores(
    { name = 'combinedStore', stores = [], persist, enhancer },
    {
        combineReducers = defaultCombineReducers,
        createBatch = defaultCreateBatch,
        createBatchMiddleware = defaultCreateBatchMiddleware,
        createReduxAnewProps = defaultCreateReduxAnewProps,
        createSetState = defaultCreateSetState,
        createReduxStore = defaultCreateReduxStore,
        applyMiddleware = defaultApplyMiddleware,
    } = {}
) {
    invariantFunctionProperty(name, 'store combination')

    /**
     * Create Object to preserve reference
     */
    const anewStore = {
        name,
        state: {},
        reducers: {},
        batches: [],
        type: 'combined',
    }

    /**
     * State Setter with anewStore as the context
     */
    anewStore.setState = createSetState(anewStore)

    /**
     * Generate Combined Anew Store
     */
    const anewReducer = combineReducers(anewStore, stores, persist)

    /**
     * Create getBatches for early reference
     */
    let getBatches = () => anewStore.batches

    /**
     * Create Batch Middleware with reference to batches
     */
    const createWithMiddlewares = applyMiddleware(createBatchMiddleware(getBatches))(
        createReduxStore
    )

    /**
     * Redux Store
     * @type { Object }
     */
    const reduxStore = createWithMiddlewares(anewReducer, anewStore.state, enhancer, persist)

    /**
     * Create anew specific store props
     * @type { Object }
     */
    reduxStore.anew = createReduxAnewProps(anewStore, anewReducer)

    /**
     * Update getBatches Reference
     */
    getBatches = () => reduxStore.anew.getBatches()

    /**
     * Extend Dispatcher to include reducers, effects, and batch
     *
     * This must be redefined to update reference to the new combined
     * reduxStore object.
     */
    reduxStore.dispatch.reducers = {}
    reduxStore.dispatch.effects = {}
    reduxStore.dispatch.actions = {}
    reduxStore.dispatch.batch = createBatch(reduxStore, 'combined')

    /**
     * Populate dispatch reducers and effects
     * and update redux dispatch reference
     */
    stores.forEach(store => {
        const {
            getState,
            anew: { name },
            dispatch: {
                reducers,
                effects,
                actions,
                batch: { done, ...batches },
            },
        } = store

        const getStoreState = () => reduxStore.getState()[name]

        /**
         * Merge into combined store
         */
        reduxStore.dispatch.reducers[name] = reducers
        reduxStore.dispatch.effects[name] = effects
        reduxStore.dispatch.actions[name] = actions
        reduxStore.dispatch.batch[name] = batches
        reduxStore.getState[name] = getStoreState

        /**
         * Update each store references
         */
        store.subscribe = reduxStore.subscribe
        store.anew.getBatches = () => reduxStore.anew.getBatches()
        store.dispatch = action => reduxStore.dispatch(action)
        store.getState = getStoreState

        /**
         * Redefine replace reducer
         */
        store.replaceReducer = function replaceReducer(nextReducer) {
            if (typeof nextReducer !== 'function') {
                throw new Error('Expected the nextReducer to be a function.')
            }

            anewStore.reducers[name] = nextReducer
            reduxReducer = combineReducers(anewStore.reducers)

            reduxStore.dispatch({ type: ActionTypes.RESET })
        }

        /**
         * Reassign reducers, effects, and batch to maintain dispatch
         * object's shape per store.
         */
        store.dispatch.persistor = reduxStore.persistor
        store.dispatch.reducers = reducers
        store.dispatch.effects = effects
        store.dispatch.actions = actions
        store.dispatch.batch = batches
        store.dispatch.batch.done = done

        /**
         * Reassign selectors to maintian getState
         * object's shape per store
         */
        reduxStore.getState[name] = Object.assign(reduxStore.getState[name], getState)
        store.getState = Object.assign(store.getState, getState)

        /**
         * Assign Core
         */
        store.anew.core = reduxStore
    })

    return reduxStore
}
