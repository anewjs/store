import Store from '../src/store'
import counterStore from './stores/counter'

describe('new Store', () => {
    test('create empty store', () => {
        const store = new Store({})
        const storeKeys = Object.keys(store)
        const commitKeys = Object.keys(store.commit)
        const stageKeys = Object.keys(store.commit.stage)

        expect(store.get()).toEqual({})

        expect(storeKeys).toContain('commit')
        expect(storeKeys).toContain('dispatch')
        expect(storeKeys).toContain('get')
        expect(storeKeys).toContain('select')
        expect(storeKeys).toContain('subscribe')

        expect(commitKeys).toContain('stage')
        expect(commitKeys).toContain('push')

        expect(stageKeys).toContain('push')
    })

    test('modify store after initiation', () => {
        const store = new Store({})

        store.use({
            state: 1,
        })

        store.use({
            getters: {
                double(state) {
                    return state * 2
                },
            },
        })

        expect(store.get()).toEqual(1)
        expect(store.get.double()).toEqual(2)
    })

    test('get initial state', () => {
        const store = new Store({
            state: 1,
        })

        expect(store.get()).toBe(1)
    })

    test('new state reference', () => {
        const state = { name: 'Hello' }
        const store = new Store({ state })

        expect(store.get()).not.toBe(state)
        expect(store.state).not.toBe(state)
    })

    test('commit reducer', () => {
        const store = new Store(counterStore)

        store.commit.inc()
        store.commit.inc()
        store.commit.inc()

        expect(store.get()).toEqual({ count: 3 })
    })

    test('stage commits', () => {
        const store = new Store(counterStore)
        const mockSubscribe = jest.fn()

        store.subscribe(mockSubscribe)
        store.commit.stage()

        store.commit.inc()
        store.commit.inc()
        store.commit.inc()

        store.commit.stage.push()

        expect(mockSubscribe).toHaveBeenCalledTimes(1)
        expect(store.get()).toEqual({ count: 3 })
    })

    test('prevent subscription call when no state changes', () => {
        const store = new Store({
            state: {
                count: 0,
            },

            reducers: {
                undefined() {},

                noStateChange(state) {
                    return state
                },

                inc(state) {
                    return {
                        count: state.count + 1,
                    }
                },
            },
        })

        const mockSubscribe = jest.fn()

        store.subscribe(mockSubscribe)

        store.commit.undefined()
        store.commit.inc()
        store.commit.noStateChange()

        expect(mockSubscribe).toHaveBeenCalledTimes(1)
        expect(store.get()).toEqual({ count: 1 })
    })

    test('dispatch action', () => {
        const store = new Store(counterStore)

        store.dispatch.inc().then(() => {
            store.dispatch.inc().then(() => {
                expect(store.get()).toEqual({ count: 2 })
            })
        })
    })

    test('dispatch mix', () => {
        const store = new Store(counterStore)

        store.dispatch.inc().then(() => {
            store.commit.stage()
            store.commit.inc()
            store.commit.stage.push()

            store.commit.inc()

            expect(store.get()).toEqual({ count: 3 })
        })
    })

    test('stage commits asynchronously', () => {
        const store = new Store(counterStore)

        store.commit.stage()
        store.commit.inc()
        store.commit.inc()

        setTimeout(() => {
            store.commit.inc()
            store.commit.stage.push()

            expect(store.get()).toEqual({ count: 3 })
        }, 300)

        store.commit.stage.push()

        expect(store.get()).toEqual({ count: 2 })
    })

    test('create anew getters', () => {
        const store = new Store(counterStore)

        store.commit.inc()

        expect(store.get.count()).toBe(1)
        expect(store.get.countDoubled()).toBe(2)
    })

    test('create anew memoized selector', () => {
        const countDoubled = jest.fn(doubled => {
            return doubled
        })

        const store = new Store({
            ...counterStore,
            state: {
                count: 1,
            },

            selectors: {
                countDoubled: store => [store.get.countDoubled, countDoubled],
            },
        })

        const value1 = store.select.countDoubled()
        const value2 = store.select.countDoubled()

        store.commit.inc()

        const value3 = store.select.countDoubled()

        expect(value1).toBe(2)
        expect(value2).toBe(2)
        expect(value3).toBe(4)
        expect(countDoubled).toHaveBeenCalledTimes(2)
    })

    test('listeners called on commit', () => {
        const mockListener = jest.fn()
        const store = new Store({
            modules: {
                counter: counterStore,
                listener: {
                    state: {
                        someState: null,
                    },

                    listeners: {
                        counter: {
                            inc({ store, state }, arg) {
                                mockListener()

                                expect(store.get()).toEqual({
                                    someState: null,
                                })

                                expect(state).toEqual({
                                    count: 1,
                                })

                                expect(arg).toEqual({
                                    someArg: 100,
                                })
                            },
                        },
                    },
                },
            },
        })

        store.commit.counter.inc({
            someArg: 100,
        })

        expect(mockListener).toHaveBeenCalled()
    })
})
