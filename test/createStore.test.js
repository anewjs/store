import Store from '../src/store'
import counterStore from './stores/counter'

describe('new Store', () => {
    test('create empty store', () => {
        const store = new Store({})
        const storeKeys = Object.keys(store)

        expect(store.get()).toEqual({})

        expect(storeKeys).toContain('commit')
        expect(storeKeys).toContain('dispatch')
        expect(storeKeys).toContain('stage')
        expect(storeKeys).toContain('get')
        expect(storeKeys).toContain('select')
        expect(storeKeys).toContain('subscribe')
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
        store.stage()

        store.commit.inc()
        store.commit.inc()
        store.commit.inc()

        store.stage.commit()

        expect(mockSubscribe).toHaveBeenCalledTimes(1)
        expect(store.get()).toEqual({ count: 3 })
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
            store.stage()
            store.commit.inc()
            store.stage.commit()

            store.commit.inc()

            expect(store.get()).toEqual({ count: 3 })
        })
    })

    test('stage commits asynchronously', () => {
        const store = new Store(counterStore)

        store.stage()
        store.commit.inc()
        store.commit.inc()

        setTimeout(() => {
            store.commit.inc()
            store.stage.commit()

            expect(store.get()).toEqual({ count: 3 })
        }, 300)

        store.stage.commit()

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
        const value3 = store.select.countDoubled()

        expect(value1).toBe(2)
        expect(value2).toBe(2)
        expect(value3).toBe(2)
        expect(countDoubled).toHaveBeenCalledTimes(1)
    })
})
