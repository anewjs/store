'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = composeReducers;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Reduces reducers into one reducer that returns next
 * state tree.
 *
 * @param  {Object}      anewStore   State and setState Object
 * @param  {Function}    baseReducer Anew Defined Reducer
 * @param  {...Function} reducers    User/ThirdPart Defined Reducers
 * @return {Function}                Final Reducer
 */
function composeReducers(anewStore) {
    for (var _len = arguments.length, reducers = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        reducers[_key - 1] = arguments[_key];
    }

    reducers = [].concat(_toConsumableArray(typeof anewStore === 'function' ? [anewStore] : []), _toConsumableArray(reducers.filter(function (reducer) {
        return typeof reducer === 'function';
    })));

    var extensionReducer = reducers.length === 1 ? reducers[0] : reducers.reduce(function (wrapper, wrapped) {
        return function (state, action) {
            return wrapper(wrapped(state, action), action);
        };
    });

    switch (anewStore.type) {
        case 'combined':
            return function (state, action) {
                return anewStore.setState(extensionReducer(anewStore.state, _extends({}, action, { state: state })));
            };
        default:
            return function (reduxState, action) {
                return anewStore.setState(extensionReducer(anewStore.state, action));
            };
    }
}