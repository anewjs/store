'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = combineReducers;

var _reduxPersist = require('redux-persist');

var _redux = require('redux');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

var _createPersistConfig = require('./createPersistConfig');

var _createPersistConfig2 = _interopRequireDefault(_createPersistConfig);

var _createStore = require('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _isStoreCreated = require('./isStoreCreated');

var _isStoreCreated2 = _interopRequireDefault(_isStoreCreated);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function combineReducers(anewStore, stores, persist) {
    var _a = stores;

    var _f = function _f(store, i) {
        var storeCreated = (0, _isStoreCreated2.default)(store);

        if (!storeCreated) {
            (0, _invariant2.default)((typeof store === 'undefined' ? 'undefined' : _typeof(store)) === 'object', 'No store provided for index "' + i + '" in the combined store "' + anewStore.name + '"');

            store = stores[i] = (0, _createStore2.default)(store);
        }

        var _store = store,
            getState = _store.getState,
            _store$anew = _store.anew,
            name = _store$anew.name,
            reducer = _store$anew.reducer;


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

    return function combination(state, action) {
        var type = action.type,
            payload = action.payload;


        switch (type) {
            case _actionTypes2.default.BATCH:
                var _a2 = payload;

                var _f2 = function _f2(batch) {
                    state = combinedReducer(state, _extends({}, batch, {
                        state: state
                    }));
                };

                for (var _i2 = 0; _i2 < _a2.length; _i2++) {
                    _f2(_a2[_i2], _i2, _a2);
                }

                undefined;

                break;
            default:
                state = combinedReducer(state, _extends({}, action, { state: state }));

                break;
        }

        return anewStore.setState(state);
    };
}