function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { persistCombineReducers } from 'redux-persist';
import { combineReducers as reduxCombineReducers } from 'redux';
import invariant from 'invariant';
import ActionTypes from './actionTypes';
import createPersistConfig from './createPersistConfig';
import createStore from './createStore';
import isStoreCreated from './isStoreCreated';
export default function combineReducers(anewStore, stores, persist) {
  /**
   * Populate/Combine State and Reducers
   */
  stores.forEach(function (store, i) {
    var storeCreated = isStoreCreated(store);

    if (!storeCreated) {
      invariant(typeof store === 'object', "No store provided for index \"" + i + "\" in the combined store \"" + anewStore.name + "\"");
      store = stores[i] = createStore(store);
    }

    var _store = store,
        getState = _store.getState,
        _store$anew = _store.anew,
        name = _store$anew.name,
        reducer = _store$anew.reducer;
    anewStore.state[name] = getState();
    anewStore.reducers[name] = reducer;
  });
  persist = createPersistConfig(persist, anewStore.name);
  /**
   * Reduce State then return anewStore reference
   */

  var combinedReducer = persist ? persistCombineReducers(persist, anewStore.reducers) : reduxCombineReducers(anewStore.reducers);
  return function combination(state, action) {
    var type = action.type,
        payload = action.payload;

    switch (type) {
      case ActionTypes.BATCH:
        payload.forEach(function (batch) {
          state = combinedReducer(state, _objectSpread({}, batch, {
            state: state
          }));
        });
        break;

      default:
        state = combinedReducer(state, _objectSpread({}, action, {
          state: state
        }));
        break;
    }

    return anewStore.setState(state);
  };
}