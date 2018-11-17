export default {
    name: 'foo',

    state: 0,

    reducers: {
        call: state => 1,
    },

    actions: {
        call() {
            return {
                type: 'foo:call',
            }
        },
    },
}
