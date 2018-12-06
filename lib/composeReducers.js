function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Reduces reducers into one reducer that returns next
 * state tree.
 *
 * @param  {Object}      anewStore   State and setState Object
 * @param  {Function}    baseReducer Anew Defined Reducer
 * @param  {...Function} reducers    User/ThirdPart Defined Reducers
 * @return {Function}                Final Reducer
 */
export default function composeReducers(anewStore) {
  for (var _len = arguments.length, reducers = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    reducers[_key - 1] = arguments[_key];
  }

  reducers = (typeof anewStore === 'function' ? [anewStore] : []).concat(reducers.filter(function (reducer) {
    return typeof reducer === 'function';
  }));
  var extensionReducer = reducers.length === 1 ? reducers[0] : reducers.reduce(function (wrapper, wrapped) {
    return function (state, action) {
      return wrapper(wrapped(state, action), action);
    };
  });

  switch (anewStore.type) {
    case 'combined':
      return function (state, action) {
        return anewStore.setState(extensionReducer(anewStore.state, _objectSpread({}, action, {
          state: state
        })));
      };

    default:
      return function (reduxState, action) {
        return anewStore.setState(extensionReducer(anewStore.state, action));
      };
  }
}