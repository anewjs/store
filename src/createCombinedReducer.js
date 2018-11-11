export default function createCombinedReducer(anewStore, reduxReducer) {
    return function(reduxState, action) {
        action.state = anewStore.state

        return anewStore.setState(reduxReducer(reduxState, action))
    }
}
