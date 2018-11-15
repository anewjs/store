import { from } from 'rxjs'
import { map } from 'rxjs/operators'
import $$observable from 'symbol-observable'
import createStore, { combineStores } from '../'
import storeInReducer from './helpers/storeInReducer'
import todoStore from './stores/todo'
import fooStore from './stores/foo'
import barStore from './stores/bar'

const noop = () => {}

describe('createStore', () => {
    it('exposes the public API', () => {
        const store = createStore()
        const methods = Object.keys(store)

        expect(methods.length).toBe(5)
        expect(methods).toContain('anew')
        expect(methods).toContain('subscribe')
        expect(methods).toContain('dispatch')
        expect(methods).toContain('getState')
        expect(methods).toContain('replaceReducer')

        const anewMethods = Object.keys(store.anew)

        expect(anewMethods.length).toBe(3)
        expect(anewMethods).toContain('getBatches')
        expect(anewMethods).toContain('reducer')
        expect(anewMethods).toContain('name')
    })

    it('throws if reducer is not a function', () => {
        const injectReducer = reducer => ({
            reducers: { reducer },
        })

        expect(() => createStore(injectReducer('test'))).toThrow()

        expect(() => createStore(injectReducer(() => {}))).not.toThrow()
    })

    it('passes the initial state', () => {
        const store = createStore({
            state: todoStore.reducers.addTodo([], 'Hello'),
        })

        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
        ])
    })

    it('applies the reducer to the previous state', () => {
        const store = createStore(todoStore)

        expect(store.getState()).toEqual([])

        store.dispatch({ type: 'UNKNOWN' })
        expect(store.getState()).toEqual([])

        store.dispatch.reducers.addTodo('Hello')
        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
        ])

        store.dispatch.reducers.addTodo('World')
        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
            {
                id: 2,
                text: 'World',
            },
        ])
    })

    it('applies the reducer to the initial state', () => {
        const store = createStore({
            ...todoStore,
            state: todoStore.reducers.addTodo([], 'Hello'),
        })

        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
        ])

        store.dispatch({ type: 'UNKNOWN' })
        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
        ])

        store.dispatch.reducers.addTodo('World')
        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
            {
                id: 2,
                text: 'World',
            },
        ])
    })

    it('supports multiple subscriptions', () => {
        const store = createStore(todoStore)
        const listenerA = jest.fn()
        const listenerB = jest.fn()

        let unsubscribeA = store.subscribe(listenerA)
        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(1)
        expect(listenerB.mock.calls.length).toBe(0)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(2)
        expect(listenerB.mock.calls.length).toBe(0)

        const unsubscribeB = store.subscribe(listenerB)
        expect(listenerA.mock.calls.length).toBe(2)
        expect(listenerB.mock.calls.length).toBe(0)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(1)

        unsubscribeA()
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(1)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(2)

        unsubscribeB()
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(2)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(2)

        unsubscribeA = store.subscribe(listenerA)
        expect(listenerA.mock.calls.length).toBe(3)
        expect(listenerB.mock.calls.length).toBe(2)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(4)
        expect(listenerB.mock.calls.length).toBe(2)
    })

    it('only removes listener once when unsubscribe is called', () => {
        const store = createStore(todoStore)
        const listenerA = jest.fn()
        const listenerB = jest.fn()

        const unsubscribeA = store.subscribe(listenerA)
        store.subscribe(listenerB)

        unsubscribeA()
        unsubscribeA()

        store.dispatch({ type: 'UNKNOWN' })
        expect(listenerA.mock.calls.length).toBe(0)
        expect(listenerB.mock.calls.length).toBe(1)
    })

    it('only removes relevant listener when unsubscribe is called', () => {
        const store = createStore(todoStore)
        const listener = jest.fn()

        store.subscribe(listener)
        const unsubscribeSecond = store.subscribe(listener)

        unsubscribeSecond()
        unsubscribeSecond()

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener.mock.calls.length).toBe(1)
    })

    it('supports removing a subscription within a subscription', () => {
        const store = createStore(todoStore)
        const listenerA = jest.fn()
        const listenerB = jest.fn()
        const listenerC = jest.fn()

        store.subscribe(listenerA)
        const unSubB = store.subscribe(() => {
            listenerB()
            unSubB()
        })
        store.subscribe(listenerC)

        store.dispatch({ type: 'UNKNOWN' })
        store.dispatch({ type: 'UNKNOWN' })

        expect(listenerA.mock.calls.length).toBe(2)
        expect(listenerB.mock.calls.length).toBe(1)
        expect(listenerC.mock.calls.length).toBe(2)
    })

    it('notifies all subscribers about current dispatch regardless if any of them gets unsubscribed in the process', () => {
        const store = createStore(todoStore)

        const unsubscribeHandles = []
        const doUnsubscribeAll = () => unsubscribeHandles.forEach(unsubscribe => unsubscribe())

        const listener1 = jest.fn()
        const listener2 = jest.fn()
        const listener3 = jest.fn()

        unsubscribeHandles.push(store.subscribe(() => listener1()))
        unsubscribeHandles.push(
            store.subscribe(() => {
                listener2()
                doUnsubscribeAll()
            })
        )
        unsubscribeHandles.push(store.subscribe(() => listener3()))

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(1)
        expect(listener2.mock.calls.length).toBe(1)
        expect(listener3.mock.calls.length).toBe(1)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(1)
        expect(listener2.mock.calls.length).toBe(1)
        expect(listener3.mock.calls.length).toBe(1)
    })

    it('notifies only subscribers active at the moment of current dispatch', () => {
        const store = createStore(todoStore)

        const listener1 = jest.fn()
        const listener2 = jest.fn()
        const listener3 = jest.fn()

        let listener3Added = false
        const maybeAddThirdListener = () => {
            if (!listener3Added) {
                listener3Added = true
                store.subscribe(() => listener3())
            }
        }

        store.subscribe(() => listener1())
        store.subscribe(() => {
            listener2()
            maybeAddThirdListener()
        })

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(1)
        expect(listener2.mock.calls.length).toBe(1)
        expect(listener3.mock.calls.length).toBe(0)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(2)
        expect(listener2.mock.calls.length).toBe(2)
        expect(listener3.mock.calls.length).toBe(1)
    })

    it('uses the last snapshot of subscribers during nested dispatch', () => {
        const store = createStore(todoStore)

        const listener1 = jest.fn()
        const listener2 = jest.fn()
        const listener3 = jest.fn()
        const listener4 = jest.fn()

        let unsubscribe4
        const unsubscribe1 = store.subscribe(() => {
            listener1()
            expect(listener1.mock.calls.length).toBe(1)
            expect(listener2.mock.calls.length).toBe(0)
            expect(listener3.mock.calls.length).toBe(0)
            expect(listener4.mock.calls.length).toBe(0)

            unsubscribe1()
            unsubscribe4 = store.subscribe(listener4)
            store.dispatch({ type: 'UNKNOWN' })

            expect(listener1.mock.calls.length).toBe(1)
            expect(listener2.mock.calls.length).toBe(1)
            expect(listener3.mock.calls.length).toBe(1)
            expect(listener4.mock.calls.length).toBe(1)
        })
        store.subscribe(listener2)
        store.subscribe(listener3)

        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(1)
        expect(listener2.mock.calls.length).toBe(2)
        expect(listener3.mock.calls.length).toBe(2)
        expect(listener4.mock.calls.length).toBe(1)

        unsubscribe4()
        store.dispatch({ type: 'UNKNOWN' })
        expect(listener1.mock.calls.length).toBe(1)
        expect(listener2.mock.calls.length).toBe(3)
        expect(listener3.mock.calls.length).toBe(3)
        expect(listener4.mock.calls.length).toBe(1)
    })

    it('provides an up-to-date state when a subscriber is notified', done => {
        const store = createStore(todoStore)
        store.subscribe(() => {
            expect(store.getState()).toEqual([
                {
                    id: 1,
                    text: 'Hello',
                },
            ])
            done()
        })
        store.dispatch.reducers.addTodo('Hello')
    })

    it('does not leak private listeners array', done => {
        const store = createStore(todoStore)
        store.subscribe(function() {
            expect(this).toBe(undefined)
            done()
        })
        store.dispatch.reducers.addTodo('Hello')
    })

    it('only accepts plain object actions', () => {
        const store = createStore(todoStore)
        expect(() => store.dispatch({ type: 'UNKNOWN' })).not.toThrow()

        function AwesomeMap() {}
        ;[null, undefined, 42, 'hey', new AwesomeMap()].forEach(nonObject =>
            expect(() => store.dispatch(nonObject)).toThrow(/plain/)
        )
    })

    it('handles nested dispatches gracefully', () => {
        const store = combineStores({
            stores: [fooStore, barStore],
        })

        store.subscribe(function kindaComponentDidUpdate() {
            const state = store.getState()

            if (state.bar === 0) {
                store.dispatch({ type: 'bar:call' })
            }
        })

        store.dispatch({ type: 'foo:call' })
        expect(store.getState()).toEqual({
            foo: 1,
            bar: 2,
        })
    })

    it('does not allow dispatch() from within a reducer', () => {
        const dispatch = storeInReducer(foo => foo.dispatch({ type: 'UNKNOWN' }))

        expect(dispatch).toThrow(/may not dispatch/)
    })

    it('does not allow getState() from within a reducer', () => {
        const dispatch = storeInReducer(foo => foo.getState())

        expect(dispatch).toThrow(/You may not call store.getState()/)
    })

    it('does not allow subscribe() from within a reducer', () => {
        const dispatch = storeInReducer(foo => foo.subscribe(noop))

        expect(dispatch).toThrow(/You may not call store.subscribe()/)
    })

    it('does not allow unsubscribe from subscribe() from within a reducer', () => {
        const dispatch = storeInReducer(
            (foo, unsubscribe) => unsubscribe(),
            foo => foo.subscribe(noop)
        )

        expect(dispatch).toThrow(/You may not unsubscribe from a store/)
    })

    it('throws if action type is missing', () => {
        const store = createStore(todoStore)
        expect(() => store.dispatch({})).toThrow(
            /Actions may not have an undefined "type" property/
        )
    })

    it('throws if action type is undefined', () => {
        const store = createStore(todoStore)
        expect(() => store.dispatch({ type: undefined })).toThrow(
            /Actions may not have an undefined "type" property/
        )
    })

    it('does not throw if action type is falsy', () => {
        const store = createStore(todoStore)
        expect(() => store.dispatch({ type: false })).not.toThrow()
        expect(() => store.dispatch({ type: 0 })).not.toThrow()
        expect(() => store.dispatch({ type: null })).not.toThrow()
        expect(() => store.dispatch({ type: '' })).not.toThrow()
    })

    it('accepts enhancer as argument', () => {
        const emptyArray = []
        const spyEnhancer = vanillaCreateStore => (...args) => {
            expect(args[1]).toEqual(emptyArray)
            expect(args.length).toBe(2)
            const vanillaStore = vanillaCreateStore(...args)
            return {
                ...vanillaStore,
                dispatch: jest.fn(vanillaStore.dispatch),
            }
        }

        const store = createStore({
            ...todoStore,
            enhancer: spyEnhancer,
        })

        const action = { type: 'todo:addTodo', payload: ['Hello'] }
        store.dispatch(action)
        expect(store.dispatch).toBeCalledWith(action)
        expect(store.getState()).toEqual([
            {
                id: 1,
                text: 'Hello',
            },
        ])
    })

    it('throws if enhancer is neither undefined nor a function', () => {
        expect(() =>
            createStore({
                ...todoStore,
                enhancer: {},
            })
        ).toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: [],
            })
        ).toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: null,
            })
        ).toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: false,
            })
        ).toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: undefined,
            })
        ).not.toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: x => x,
            })
        ).not.toThrow()

        expect(() =>
            createStore({
                ...todoStore,
                enhancer: x => x,
            })
        ).not.toThrow()
    })

    it('throws if nextReducer is not a function', () => {
        const store = createStore(todoStore)

        expect(() => store.replaceReducer()).toThrow('Expected the nextReducer to be a function.')

        expect(() => store.replaceReducer(noop)).not.toThrow()
    })

    it('throws if listener is not a function', () => {
        const store = createStore(todoStore)

        expect(() => store.subscribe()).toThrow()

        expect(() => store.subscribe('')).toThrow()

        expect(() => store.subscribe(null)).toThrow()

        expect(() => store.subscribe(undefined)).toThrow()
    })

    describe('Symbol.observable interop point', () => {
        it('should exist', () => {
            const store = createStore(todoStore)
            expect(typeof store[$$observable]).toBe('function')
        })

        describe('returned value', () => {
            it('should be subscribable', () => {
                const store = createStore(todoStore)
                const obs = store[$$observable]()
                expect(typeof obs.subscribe).toBe('function')
            })

            it('should throw a TypeError if an observer object is not supplied to subscribe', () => {
                const store = createStore(todoStore)
                const obs = store[$$observable]()

                expect(function() {
                    obs.subscribe()
                }).toThrowError(new TypeError('Expected the observer to be an object.'))

                expect(function() {
                    obs.subscribe(null)
                }).toThrowError(new TypeError('Expected the observer to be an object.'))

                expect(function() {
                    obs.subscribe(() => {})
                }).toThrowError(new TypeError('Expected the observer to be an object.'))

                expect(function() {
                    obs.subscribe({})
                }).not.toThrow()
            })

            it('should return a subscription object when subscribed', () => {
                const store = createStore(todoStore)
                const obs = store[$$observable]()
                const sub = obs.subscribe({})
                expect(typeof sub.unsubscribe).toBe('function')
            })
        })

        it('should pass an integration test with no unsubscribe', () => {
            const store = combineStores({
                stores: [fooStore, barStore],
            })

            const observable = store[$$observable]()
            const results = []

            observable.subscribe({
                next(state) {
                    results.push(state)
                },
            })

            store.dispatch({ type: 'foo:call' })
            store.dispatch({ type: 'bar:call' })

            expect(results).toEqual([{ foo: 0, bar: 0 }, { foo: 1, bar: 0 }, { foo: 1, bar: 2 }])
        })

        it('should pass an integration test with an unsubscribe', () => {
            const store = combineStores({
                stores: [fooStore, barStore],
            })

            const observable = store[$$observable]()
            const results = []

            const sub = observable.subscribe({
                next(state) {
                    results.push(state)
                },
            })

            store.dispatch({ type: 'foo:call' })
            sub.unsubscribe()
            store.dispatch({ type: 'bar:call' })

            expect(results).toEqual([{ foo: 0, bar: 0 }, { foo: 1, bar: 0 }])
        })
    })
})
