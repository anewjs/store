import Store from '../src/store'

const storeConfig = (mockCounterIncListener, mockTodoAddListener) => ({
    actions: {
        incAndAdd(store) {
            store.commit.counter.inc(2)
            store.commit.list.add(3)
        },
    },

    selectors: {
        listPlusTodoCount: store => [
            store.get.list.items,
            store.get.list.todo.items,

            (listItems, todoItems) => {
                return listItems.length + todoItems.length
            },
        ],
    },

    modules: {
        counter: {
            state: 1,

            reducers: {
                inc(state, add = 1) {
                    return state + add
                },
            },

            actions: {
                inc(store, add = 3) {
                    store.commit.inc(add)
                    store.core.commit.list.add()
                },

                incDelayed(store, add = 2) {
                    setTimeout(() => store.dispatch.inc(add), 1000)
                },

                inc99(store) {
                    store.stage()

                    new Array(99).fill(1).forEach(() => {
                        store.commit.inc(1)
                    })

                    store.stage.commit()
                },
            },

            getters: {
                count(state) {
                    return state
                },
            },

            selectors: {
                count: store => [store.get.count, count => count],
            },
        },

        list: {
            state: {
                items: [],
            },

            reducers: {
                add(state, add = 1) {
                    return {
                        items: [...state.items, add],
                    }
                },
            },

            getters: {
                items(state) {
                    return state.items
                },
            },

            selectors: {
                count: store => [store.get.items, items => items.length],
            },

            listeners: {
                counter: {
                    inc: mockCounterIncListener,
                },
            },

            modules: {
                another: {
                    listeners: {
                        todo: {
                            add: mockTodoAddListener,
                        },
                    },
                },

                todo: {
                    state: {
                        items: [],
                    },

                    reducers: {
                        add(state, add = 2) {
                            return {
                                items: [...state.items, add],
                            }
                        },
                    },

                    getters: {
                        items(state) {
                            return state.items
                        },
                    },

                    selectors: {
                        count: store => [store.get.items, items => items.length],
                    },
                },
            },
        },
    },
})

describe('Experimental Store', () => {
    it('get', () => {
        const store = new Store(storeConfig())

        expect(store.get()).toEqual({
            counter: 1,
            list: {
                items: [],
                another: {},
                todo: {
                    items: [],
                },
            },
        })

        expect(store.get.counter()).toBe(1)
        expect(store.get.list()).toEqual({
            items: [],
            another: {},
            todo: {
                items: [],
            },
        })
        expect(store.get.list.items()).toEqual([])
        expect(store.get.list.todo()).toEqual({ items: [] })
        expect(store.get.list.todo.items()).toEqual([])
    })

    it('select & commit & subscribe & on.reducers', () => {
        const mockCounterIncListener = jest.fn()
        const mockTodoAddListener = jest.fn()
        const store = new Store(storeConfig(mockCounterIncListener, mockTodoAddListener))
        const mockSubscribe = jest.fn()

        const unsubscribe = store.subscribe(mockSubscribe)

        store.stage()
        store.commit.counter.inc()
        store.commit.counter.inc()
        store.stage.commit()

        store.commit.list.add()

        unsubscribe()

        store.commit.list.todo.add()

        expect(mockCounterIncListener).toHaveBeenCalledTimes(2)
        expect(mockTodoAddListener).toHaveBeenCalledTimes(1)
        expect(mockSubscribe).toHaveBeenCalledTimes(2)
        expect(store.select.counter.count()).toBe(3)
        expect(store.select.list.count()).toBe(1)
        expect(store.select.list.todo.count()).toBe(1)
        expect(store.select.listPlusTodoCount()).toBe(2)
    })

    it('get & dispatch', () => {
        const store = new Store(storeConfig())

        expect(store.get.counter()).toBe(1)
        expect(store.get.list.items()).toEqual([])

        store.dispatch.incAndAdd()

        expect(store.get.counter()).toBe(3)
        expect(store.get.list.items()).toEqual([3])
    })
})

// 1. Provider
// 2. Connect
// 3. Persistor?
