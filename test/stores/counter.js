export default {
    state: {
        count: 0,
    },

    reducers: {
        inc: state => ({ count: state.count + 1 }),
    },

    actions: {
        inc({ commit }) {
            return new Promise(resolve => {
                setTimeout(() => {
                    commit.inc()

                    resolve()
                }, 300)
            })
        },
    },

    getters: {
        count: state => state.count,

        countDoubled: state => state.count * 2,
    },

    selectors: {
        countAdd: store => [store.get.count, count => count],
    },
}
