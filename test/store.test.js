import Store from '../src/store'

const storeConfig = () => ({
    actions: {
        incAndAdd(store) {
            store.commit.counter.inc(2)
            store.commit.list.add(3)
        },
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
                count: store => [
                    store.get.count,
                    count => count
                ]
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
                count: store => [
                    store.get.items,
                    items => items.length
                ]
            },

            modules: {
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
                        count: store => [
                            store.get.items,
                            items => items.length
                        ]
                    },
                },
            },
        },
    },

    selectors: {
        listPlusTodoCount: store => [
            store.get.list.items,
            store.get.list.todo.items,

            (listItems, todoItems) => {
                return listItems.length + todoItems.length
            },
        ]
    },

    on: {
        commit(type, args) {
            console.log('committed', type, args)
        },

        dispatch(type, args) {
            console.log('dispatched', type, args)
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
                todo: {
                    items: [],
                },
            }
        })

        expect(store.get.counter()).toBe(1)
        expect(store.get.list()).toEqual({
            items: [],
            todo: {
                items: [],
            },
        })
        expect(store.get.list.items()).toEqual([])
        expect(store.get.list.todo()).toEqual({ items: [] })
        expect(store.get.list.todo.items()).toEqual([])
    })

    it('select & commit', () => {
        const store = new Store(storeConfig())

        store.commit.counter.inc()
        store.commit.counter.inc()
        store.commit.list.add()
        store.commit.list.todo.add()

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
//      1. Subscribe
//      2. Staging
//      3. Connect
// 2. OutsideNamespace inside reducers and actions
// 3. Persistor
// 4. Mutators?