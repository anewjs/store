import { combineStores } from '..'
import bar from './stores/bar'
import counter from './stores/counter'
import foo from './stores/foo'
import list from './stores/list'

jest.mock('invariant')

describe('combineStores', () => {
    test('create empty store', () => {
        const store = combineStores({
            stores: [foo, bar],
        })

        const getStateKeys = Object.keys(store.getState)
        const dispatchKeys = Object.keys(store.dispatch)
        const reducerKeys = Object.keys(store.dispatch.reducers)
        const batchKeys = Object.keys(store.dispatch.batch)
        const effectKeys = Object.keys(store.dispatch.effects)
        const actionKeys = Object.keys(store.dispatch.actions)

        expect(store.anew.name).toBe('combinedStore')
        expect(store.getState()).toEqual({
            bar: 0,
            foo: 0,
        })

        expect(dispatchKeys).toContain('reducers')
        expect(dispatchKeys).toContain('effects')
        expect(dispatchKeys).toContain('actions')
        expect(dispatchKeys).toContain('batch')

        expect(getStateKeys).toContain('foo')
        expect(getStateKeys).toContain('bar')

        expect(reducerKeys).toContain('foo')
        expect(reducerKeys).toContain('bar')

        expect(batchKeys).toContain('foo')
        expect(batchKeys).toContain('bar')

        expect(effectKeys).toContain('foo')
        expect(effectKeys).toContain('bar')

        expect(actionKeys).toContain('foo')
        expect(actionKeys).toContain('bar')
    })

    test('dispatch one action to multiple stores', () => {
        const store = combineStores({
            stores: [
                foo,
                {
                    ...bar,
                    reducers: {
                        ...bar.reducers,
                        foo: {
                            call(state, fooState, add = 1) {
                                return state + fooState + add
                            },
                        },
                    },
                },
            ],
        })

        store.dispatch.reducers.foo.call(2)
        store.dispatch.actions.foo.call()

        expect(store.getState()).toEqual({
            foo: 1,
            bar: 4,
        })
    })

    test('dispatch from effect', () => {
        const store = combineStores({
            stores: [
                foo,
                bar,
                {
                    ...counter,
                    effects: {
                        inc(store) {
                            store.dispatch.inc()
                        },

                        counterEffect(store) {
                            store.batch.inc()
                            store.actions.inc()
                            store.dispatch.inc()
                            store.effects.inc()

                            expect(store.select.countDoubled()).toBe(8)
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.counter.counterEffect()

        expect(store.getState()).toEqual({
            foo: 0,
            bar: 0,
            counter: {
                count: 4,
            },
        })
    })

    test('dispatch reducer from outside effect', () => {
        const store = combineStores({
            stores: [
                foo,
                {
                    ...bar,
                    effects: {
                        foo({ core }) {
                            core.dispatch.foo.call()
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.foo()

        expect(store.getState()).toEqual({
            foo: 1,
            bar: 0,
        })
    })

    test('dispatch batch from outside effect', () => {
        const store = combineStores({
            stores: [
                foo,
                {
                    ...bar,
                    effects: {
                        foo({ core }) {
                            core.batch.foo.call()
                            core.batch.done()
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.foo()

        expect(store.getState()).toEqual({
            foo: 1,
            bar: 0,
        })
    })

    test('dispatch action from outside effect', () => {
        const store = combineStores({
            stores: [
                {
                    ...foo,
                    actions: {
                        call() {
                            return {
                                type: 'foo:call',
                            }
                        },
                    },
                },
                {
                    ...bar,
                    effects: {
                        foo({ core }) {
                            core.actions.foo.call()
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.foo()

        expect(store.getState()).toEqual({
            foo: 1,
            bar: 0,
        })
    })

    test('dispatch effect from outside effect', () => {
        const store = combineStores({
            stores: [
                {
                    ...foo,
                    effects: {
                        someEffect({ dispatch }) {
                            dispatch.call()
                        },
                    },
                },
                {
                    ...bar,
                    effects: {
                        foo({ core }) {
                            core.effects.foo.someEffect()
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.foo()

        expect(store.getState()).toEqual({
            foo: 1,
            bar: 0,
        })
    })

    test('access core state from simple selector', () => {
        const store = combineStores({
            stores: [
                {
                    ...foo,
                    state: 1,
                },
                {
                    ...bar,
                    selectors: {
                        getFoo: store => store.create((state, core) => core.foo),
                    },
                },
            ],
        })

        expect(store.getState.bar.getFoo()).toEqual(1)
    })

    test('access core selectors from memoize selector', () => {
        const store = combineStores({
            stores: [
                {
                    ...foo,
                    state: 1,

                    selectors: {
                        getFoo: store => store.create(state => state),
                    },
                },
                {
                    ...bar,
                    selectors: {
                        getFoo: store =>
                            store.create([store.core.foo.getFoo], foo => {
                                return foo
                            }),
                    },
                },
            ],
        })

        expect(store.getState.foo.getFoo()).toEqual(1)
        expect(store.getState.bar.getFoo()).toEqual(1)
    })

    test('access select from effect', () => {
        const store = combineStores({
            stores: [
                foo,
                {
                    ...bar,
                    selectors: {
                        bar: store => store.create(state => state),
                    },
                    effects: {
                        call({ dispatch, select, core }) {
                            dispatch.call()

                            expect(select.bar()).toBe(2)
                            expect(select()).toBe(2)
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.call()
    })

    test('access core select from effect', () => {
        const store = combineStores({
            stores: [
                {
                    ...foo,
                    selectors: {
                        foo: store => store.create(state => state),
                    },
                },
                {
                    ...bar,
                    effects: {
                        call({ core }) {
                            core.dispatch.foo.call()

                            expect(core.select.foo()).toBe(1)
                            expect(core.select.foo.foo()).toBe(1)
                            expect(core.select()).toEqual({
                                foo: 1,
                                bar: 0,
                            })
                        },
                    },
                },
            ],
        })

        store.dispatch.effects.bar.call()
    })

    test('batch equivalent to dispatch', () => {
        const store1 = combineStores({
            stores: [counter, list],
        })

        const store2 = combineStores({
            stores: [counter, list],
        })

        // Dispatch
        store1.dispatch.reducers.counter.inc()
        store1.dispatch.reducers.counter.inc()
        store1.dispatch.reducers.counter.inc()

        // Batch
        store2.dispatch.batch.counter.inc()
        store2.dispatch.batch.counter.inc()
        store2.dispatch.batch.counter.inc()
        store2.dispatch.batch.counter.done()

        expect(store1.getState()).toEqual(store2.getState())
    })

    test('mix equivalent to dispatch', () => {
        const store1 = combineStores({
            stores: [counter, list],
        })

        const store2 = combineStores({
            stores: [counter, list],
        })

        // Dispatch
        store1.dispatch.reducers.counter.inc()
        store1.dispatch.reducers.counter.inc()
        store1.dispatch.reducers.counter.inc()
        store1.dispatch.reducers.counter.inc()

        // Mix
        store2.dispatch.batch.counter.inc()
        store2.dispatch.reducers.counter.inc()
        store2.dispatch.batch.counter.inc()
        store2.dispatch.reducers.counter.inc()

        expect(store1.getState()).toEqual(store2.getState())
    })
})
