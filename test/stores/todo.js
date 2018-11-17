export default {
    name: 'todo',

    state: [],

    reducers: {
        addTodo(state, text) {
            return [
                ...state,
                {
                    id: state.length + 1,
                    text,
                },
            ]
        },
    },
}
