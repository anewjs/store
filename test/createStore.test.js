import invariant from 'invariant'

import createStore, { createTestEnv, ActionTypes } from '../'
import counterStore from './stores/counter'

jest.mock('invariant')

describe('createStore', () => {
    test('create empty store', () => {
        const store = createStore()
        const dispatchKeys = Object.keys(store.dispatch)

        expect(store.anew.name).toBe('store')
        expect(store.getState()).toEqual({})

        expect(dispatchKeys).toContain('reducers')
        expect(dispatchKeys).toContain('effects')
        expect(dispatchKeys).toContain('actions')
        expect(dispatchKeys).toContain('batch')
    })

    test('create namespaced store', () => {
        const store = createStore({
            name: 'todo',
        })

        expect(store.anew.name).toBe('todo')
    })

    test('creating namespace with a function property throws error', () => {
        const store = createStore({
            name: 'name',
        })

        expect(invariant).toHaveBeenCalled()
    })

    test('get initial state', () => {
        const store = createStore({
            state: 1,
        })

        expect(store.getState()).toBe(1)
    })

    test('preserve state reference', () => {
        const state = { name: 'Hello' }
        const store = createStore({
            state,

            reducers: {
                setState: (state, nextState) => nextState,
            },
        })

        store.dispatch.reducers.setState(state)

        expect(store.getState()).toBe(state)
    })

    test('State not an object with persist throws an error', () => {
        const store = createStore({
            state: [],

            persist: true,
        })

        expect(invariant).toHaveBeenCalled()
    })

    test('persist initial state', () => {
        const store = createStore({
            state: {},

            persist: true,
        })

        expect(store.getState()).toEqual({
            _persist: {
                rehydrated: false,
                version: -1,
            },
        })
    })

    test('Create persistor store', () => {
        const store = createStore({ persist: true })
        const methods = Object.keys(store.dispatch.persistor)

        expect(typeof store.persistor).toBe('object')
        expect(typeof store.getState.persistor).toBe('function')
        expect(typeof store.dispatch.persistor).toBe('function')
        expect(methods).toContain('flush')
        expect(methods).toContain('pause')
        expect(methods).toContain('persist')
        expect(methods).toContain('purge')
    })

    test('dispatch reducer', () => {
        const store = createStore(counterStore)

        store.dispatch.reducers.inc()
        store.dispatch.reducers.inc()
        store.dispatch.reducers.inc()

        expect(store.getState()).toEqual({ count: 3 })
    })

    test('dispatch batch', () => {
        const store = createStore(counterStore)

        store.dispatch.batch.inc()
        store.dispatch.batch.inc()
        store.dispatch.batch.inc()
        store.dispatch.batch.done()

        expect(store.getState()).toEqual({ count: 3 })
    })

    test('dispatch action', () => {
        const store = createStore(counterStore)

        store.dispatch.actions.inc()
        store.dispatch.actions.inc()
        store.dispatch.actions.inc()

        expect(store.getState()).toEqual({ count: 3 })
    })

    test('dispatch effect', () => {
        const store = createStore(counterStore)

        store.dispatch.effects.inc().then(() => {
            store.dispatch.effects.inc().then(() => {
                expect(store.getState()).toEqual({ count: 2 })
            })
        })
    })

    test('dispatch mix', () => {
        const store = createStore(counterStore)

        store.dispatch.effects.inc().then(() => {
            store.dispatch.batch.inc()
            store.dispatch.reducers.inc()
            store.dispatch.actions.inc()

            expect(store.getState()).toEqual({ count: 4 })
        })
    })

    test('dispatch batch on done flag', () => {
        const store = createStore(counterStore)

        store.dispatch.batch.inc()
        store.dispatch.batch.inc()

        expect(store.getState()).toEqual({ count: 0 })

        store.dispatch.batch.inc()
        store.dispatch.batch.done()

        expect(store.getState()).toEqual({ count: 3 })
    })

    test('dispatch batch in asynchronously', () => {
        const store = createStore(counterStore)

        store.dispatch.batch.inc()
        store.dispatch.batch.inc()

        setTimeout(() => {
            store.dispatch.batch.inc()
            store.dispatch.batch.done()

            expect(store.getState()).toEqual({ count: 3 })
        }, 300)

        store.dispatch.batch.done()

        expect(store.getState()).toEqual({ count: 2 })
    })

    test('dispatch batch excluding last one', () => {
        const store = createStore(counterStore)

        store.dispatch.batch.inc()
        store.dispatch.batch.inc()
        store.dispatch.batch.inc()

        store.anew.getBatches().pop()

        store.dispatch.batch.done()

        expect(store.getState()).toEqual({ count: 2 })
    })

    test('dispatch batch with reducer instead of done flag', () => {
        const store = createStore(counterStore)

        store.dispatch.batch.inc()
        store.dispatch.batch.inc()
        store.dispatch.reducers.inc()

        expect(store.getState()).toEqual({ count: 3 })
    })

    test('reset to initial state', () => {
        const store = createStore(counterStore)

        store.dispatch.reducers.inc()
        store.dispatch({ type: ActionTypes.RESET })

        expect(store.getState()).toEqual({ count: 0 })
    })

    test('reserved reducer name throws error', () => {
        const store = createStore({
            reducers: {
                done: {},
            },
        })

        expect(invariant).toHaveBeenCalled()
    })

    test('selector name as a function property throws error', () => {
        const store = createStore({
            selectors: {
                name: () => {},
            },
        })

        expect(invariant).toHaveBeenCalled()
    })

    test('creating test environment returns store creator', () => {
        const store = createStore(counterStore)
        const createCounterStore = createTestEnv(store)
        const counterStore = createCounterStore()
        const methods = Object.keys(counterStore)
        const anewMethods = Object.keys(counterStore.anew)

        expect(typeof createCounterStore).toBe('function')

        expect(methods.length).toBe(5)
        expect(methods).toContain('anew')
        expect(methods).toContain('subscribe')
        expect(methods).toContain('dispatch')
        expect(methods).toContain('getState')
        expect(methods).toContain('replaceReducer')

        expect(anewMethods.length).toBe(3)
        expect(anewMethods).toContain('getBatches')
        expect(anewMethods).toContain('reducer')
        expect(anewMethods).toContain('name')
    })

    test('create anew simple selector', () => {
        const store = createStore(counterStore)

        store.dispatch.reducers.inc()

        expect(store.getState.count()).toBe(1)
        expect(store.getState.countDoubled()).toBe(2)
    })

    test('create anew prop selector', () => {
        const store = createStore(counterStore)

        store.dispatch.reducers.inc()

        expect(store.getState.add()).toBe(1)
        expect(store.getState.add({}, { add: 2 })).toBe(2)
        expect(store.getState.countAdd()).toBe(2)
        expect(store.getState.countAdd({ add: 4 })).toBe(5)
    })

    test('create anew memoized selector', () => {
        const countDoubledAdd = jest.fn((doubled, add) => {
            return doubled + add
        })

        const store = createStore({
            ...counterStore,
            state: {
                count: 1,
            },

            selectors: {
                ...counterStore.selectors,

                countDoubledAdd: store =>
                    store.create([store.select.countDoubled, store.select.add], countDoubledAdd),
            },
        })

        const value1 = store.getState.countDoubledAdd()
        const value2 = store.getState.countDoubledAdd()
        const value3 = store.getState.countDoubledAdd()
        const value4 = store.getState.countDoubledAdd({ add: 2 })

        expect(value1).toBe(3)
        expect(value2).toBe(3)
        expect(value3).toBe(3)
        expect(value4).toBe(4)
        expect(countDoubledAdd).toHaveBeenCalledTimes(2)
    })
})
