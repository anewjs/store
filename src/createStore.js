import { createStore as defaultCreateReduxStore } from 'redux'
import { bindActionCreators as defaultBindActionCreators } from 'redux'
import { createSelector as defaultCreateSelector } from 'reselect'

import defaultCreateBatch from './createBatch'
import defaultCreateReducer from './createReducer'
import defaultCreateReduxAnewProps from './createReduxAnewProps'
import defaultCreateSetState from './createSetState'
import defaultCreateAnewSelector from './createAnewSelector'
import defaultCreatePersistStore from './createPersistStore'

import invariant from 'invariant'
import invariantFunctionProperty from './invariantFunctionProperty'
import reservedReducerNames from './reservedReducerNames'

export default function createStore(
    {
        name = 'store',
        state = {},
        reducers = {},
        effects = {},
        actions = {},
        selectors = {},
        persist,
        reducer,
        enhancer,
    },
    {
        createBatch = defaultCreateBatch,
        createReducer = defaultCreateReducer,
        createReduxAnewProps = defaultCreateReduxAnewProps,
        createSetState = defaultCreateSetState,
        createAnewSelector = defaultCreateAnewSelector,
        createPersistStore = defaultCreatePersistStore,
        createSelector = defaultCreateSelector,
        createReduxStore = defaultCreateReduxStore,
        bindActionCreators = defaultBindActionCreators,
    } = {}
) {
    invariantFunctionProperty(name, 'store creation')

    invariant(
        typeof reducer !== 'object',
        `Wrong type "reducer" was passed as an object instead of a function ` +
            `for the store named "${name}". It seems like you accidentally ` +
            `spelled reducers as reducer. The reducer parameter can only be a ` +
            `function, recieved an object instead.`
    )

    /**
     * Create Object to preserve reference
     */
    const anewStore = {
        name,
        state,
        reducers,
        actions,
        selectors,
        effects: { ...effects },
        batches: [],
    }

    /**
     * Create setState method for an immutable state updates.
     * This also set this anewStore as the conext
     */
    anewStore.setState = createSetState(anewStore)

    /**
     * Reduce state to new value after dispatching an action
     * @param  { Object } reduxState      Redux State Object (Not Used)
     * @param  { String } options.type    Redux Type
     * @param  { String } options.payload Redux Payload
     * @param  { Object } options.state   Application Combined State
     * @param  { Object } options.actions Chain of actions to dispatch
     * @return { Object }                 Updated Anew State Object
     */
    const anewReducer = createReducer(anewStore, reducer, persist)

    /**
     * Redux Store
     * @type { Object }
     */
    const store = createReduxStore(anewReducer, anewStore.state, enhancer)
    const reduxStore = createPersistStore(persist, store)

    /**
     * Create anew specific store props
     * @type { Object }
     */
    reduxStore.anew = createReduxAnewProps(anewStore, anewReducer)

    /**
     * Extend Dispatcher to include reducers, effects, and batch.
     *
     * Reducers: are pure functions that reduce the state to a shallow clone of
     * the previous state with modification. The state object is updated via
     * the dispatch method. Reducers receive the state object and a payload list as parameters.
     * A reducer defined within the store that lives under an outside namespace receive both
     * the active and outside namespace state objects and a payload list as parameters.
     *
     * Effects: are pure functions that fire regular/batched dispatches. They are useful for
     * executing async logic. The context is bound to the anewStore object. Effects receive the
     * store object and a payload list as parameters.
     *
     * Actions: are pure functions that return an action object. They are mainly used for
     * user defined reducers that have user defined action types. This can be useful for
     * using with pacakges that follow the standard redux api, such as `react-router-redux`.
     * Actions receive a payload list as parameters.
     *
     * Batch: is a dispatch method for executing mutluple dispatches (reducers) via one dispatch
     * call. This prevents the need for components to re-render for each dispatch fired. Batch
     * also includes a done method which is used to mark the completion of a batch. The done method
     * syncs the anewStore state object with the reduxStore state object and clears the
     * batch registry.
     *
     */
    reduxStore.dispatch.reducers = {}
    reduxStore.dispatch.effects = {}
    reduxStore.dispatch.actions = {}
    reduxStore.dispatch.batch = createBatch(reduxStore)

    /**
     * Transfer redux store dispatch methods.
     * Avoid referencing for dispatch and batch as their references
     * will be updated when stores are combined.
     */
    anewStore.dispatch = action => reduxStore.dispatch(action)
    anewStore.batch = batch => reduxStore.dispatch.batch(batch)
    anewStore.batch.done = reduxStore.dispatch.batch.done

    /**
     * Trasfer redux store getState methods
     */
    anewStore.select = {}

    /**
     * Populate getState selectors
     */
    const selectorParams = {
        select: anewStore.select,
        create: createAnewSelector(anewStore, reduxStore),
    }

    Object.entries(selectors).forEach(([selectorName, selectorCreator]) => {
        invariantFunctionProperty(selectorName, name)

        function selectorWithParams(...payload) {
            if (!selectorParams.core && reduxStore.anew.core) {
                selectorParams.core = reduxStore.anew.core.getState
            }

            const selector = selectorCreator(selectorParams)
            const { ref, value } = selector(...payload)

            reduxStore.getState[selectorName] = ref
            anewStore.select[selectorName] = ref

            return value
        }

        reduxStore.getState[selectorName] = selectorWithParams
        anewStore.select[selectorName] = selectorWithParams
    })

    /**
     * Populate dispatch reducers
     */
    Object.entries(reducers).forEach(([reducerName, reducer]) => {
        const reducerType = typeof reducer
        const isFunction = reducerType === 'function'
        const isObject = reducerType === 'object'

        invariant(
            reservedReducerNames.indexOf(reducerName) === -1,
            `"${reducerName} is a reserved reducer word. Please choose a different name " ` +
                `for "${reducerName}" in "${name}"`
        )

        invariant(
            isFunction || isObject,
            `Store reducers can be functions or objects ` +
                `Recieved "${reducerType}" ` +
                `for "${reducerName}" in "${name}"`
        )

        if (isFunction) {
            reduxStore.dispatch.reducers[reducerName] = function(...payload) {
                return reduxStore.dispatch({
                    type: `${anewStore.name}:${reducerName}`,
                    payload,
                })
            }

            reduxStore.dispatch.batch[reducerName] = function(...payload) {
                const batch = { type: `${anewStore.name}:${reducerName}`, payload }

                reduxStore.anew.getBatches().push(batch)

                return batch
            }

            anewStore.dispatch[reducerName] = reduxStore.dispatch.reducers[reducerName]
            anewStore.batch[reducerName] = reduxStore.dispatch.batch[reducerName]
        }
    })

    /**
     * Populate dispatch actions
     * Referencing anewStore.dispatch so when reduxStore.dispatch changes
     * during combination
     */
    reduxStore.dispatch.actions = bindActionCreators(anewStore.actions, anewStore.dispatch)
    anewStore.actions = reduxStore.dispatch.actions

    /**
     * Populate dispatch effects
     */
    const effectParams = {
        actions: anewStore.actions,
        batch: anewStore.batch,
        dispatch: anewStore.dispatch,
        effects: anewStore.effects,
        select: anewStore.select,
    }

    Object.entries(effects).forEach(([effectName, effect]) => {
        const effectType = typeof effect

        invariant(
            effectType === 'function',
            `Store effects can only be functions ` +
                `Recieved "${effectType}" ` +
                `for "${effectName}" in "${anewStore.name}"`
        )

        function effectWithParams(...args) {
            if (!effectParams.persistor && reduxStore.dispatch.persistor) {
                effectParams.persistor = reduxStore.dispatch.persistor
            }

            if (!effectParams.core && reduxStore.anew.core) {
                const {
                    getState,
                    firestore,
                    dispatch: { reducers, effects, actions, batch },
                } = reduxStore.anew.core

                effectParams.firestore = firestore

                effectParams.core = {
                    select: getState,
                    dispatch: reducers,
                    batch,
                    effects,
                    actions,
                }
            }

            function effectsBinded(...payload) {
                return effect(effectParams, ...payload)
            }

            reduxStore.dispatch.effects[effectName] = effectsBinded
            anewStore.effects[effectName] = effectsBinded

            return effectsBinded(...args)
        }

        reduxStore.dispatch.effects[effectName] = effectWithParams
        anewStore.effects[effectName] = effectWithParams
    })

    return reduxStore
}
