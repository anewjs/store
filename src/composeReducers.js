/**
 * Reduces reducers into one reducer that returns next
 * state tree.
 *
 * @param  {Object}      anewStore   State and setState Object
 * @param  {Function}    baseReducer Anew Defined Reducer
 * @param  {...Function} reducers    User/ThirdPart Defined Reducers
 * @return {Function}                Final Reducer
 */
export default function composeReducers(anewStore, ...reducers) {
    reducers = [
        ...(typeof anewStore === 'function' ? [anewStore] : []),
        ...reducers.filter(reducer => typeof reducer === 'function'),
    ]

    const extensionReducer =
        reducers.length === 1
            ? reducers[0]
            : reducers.reduce((wrapper, wrapped) => {
                  return (state, action) => {
                      return wrapper(wrapped(state, action), action)
                  }
              })

    switch (anewStore.type) {
        case 'combined':
            return (state, action) => {
                return anewStore.setState(extensionReducer(anewStore.state, { ...action, state }))
            }
        default:
            return (reduxState, action) => {
                return anewStore.setState(extensionReducer(anewStore.state, action))
            }
    }
}
