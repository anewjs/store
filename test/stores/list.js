export default {
    name: 'list',

    state: [],

    reducers: {
        push(state) {
            return [...state, 1]
        },

        counter: {
            inc(state, counter) {
                return [...state, counter.count]
            },
        },
    },
}
