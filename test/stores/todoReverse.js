export default {
    name: 'todoReverse',

    state: [],

    reducers: {
        addTodo(state, text) {
            return [
                {
                    id: state.length + 1,
                    text,
                },
                ...state,
            ]
        },
    },
}
