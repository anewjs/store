'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = combineReducers;

var _redux = require('redux');

var _reduxPersist = require('redux-persist');

var _createPersistConfig = require('./createPersistConfig');

var _createPersistConfig2 = _interopRequireDefault(_createPersistConfig);

var _createStore = require('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

var _isStoreCreated = require('./isStoreCreated');

var _isStoreCreated2 = _interopRequireDefault(_isStoreCreated);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function combineReducers(anewStore, stores, persist) {
    var _a = stores;

    var _f = function _f(store, i) {
        var storeCreated = (0, _isStoreCreated2.default)(store);

        if (!storeCreated) {
            stores[i] = (0, _createStore2.default)(store);
        }

        var _ref = storeCreated ? store : stores[i],
            getState = _ref.getState,
            _ref$anew = _ref.anew,
            name = _ref$anew.name,
            reducer = _ref$anew.reducer;

        anewStore.state[name] = getState();
        anewStore.reducers[name] = reducer;
    };

    for (var _i = 0; _i < _a.length; _i++) {
        _f(_a[_i], _i, _a);
    }

    /**
     * Populate/Combine State and Reducers
     */
    undefined;

    persist = (0, _createPersistConfig2.default)(persist, anewStore.name);

    /**
     * Reduce State then return anewStore reference
     */
    var combinedReducer = persist ? (0, _reduxPersist.persistCombineReducers)(persist, anewStore.reducers) : (0, _redux.combineReducers)(anewStore.reducers);

    return function combination() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var action = arguments[1];

        switch (action.type) {
            case _actionTypes2.default.BATCH:
                for (var i = 0, payloadLen = action.payload.length; i < payloadLen; i++) {
                    var batchAction = action.payload[i];

                    state = combinedReducer(state, _extends({}, batchAction, {
                        state: state
                    }));
                }

                return state;
            default:
                return combinedReducer(state, action);
        }
    };
}