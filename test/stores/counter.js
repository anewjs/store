export default {
    name: 'counter',

    state: {
        count: 0,
    },

    reducers: {
        inc: state => ({ count: state.count + 1 }),
    },

    effects: {
        inc({ dispatch }) {
            return new Promise(resolve => {
                setTimeout(() => {
                    dispatch.inc()

                    resolve()
                }, 300)
            })
        },
    },

    actions: {
        inc() {
            return {
                type: 'counter:inc',
            }
        },
    },

    selectors: {
        // Prop Selectors
        add: store => store.create('add', 1),

        // Simple Selectors
        count: store => store.create(state => state.count),

        countDoubled: store => store.create(state => state.count * 2),

        // Selectors
        countAdd: store =>
            store.create([store.select.count, store.select.add], (count, add) => {
                return count + add
            }),
    },
}
