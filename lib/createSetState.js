function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

import isPlainObject from './isPlainObject';
export default function createSetState(anewStore) {
  if (isPlainObject(anewStore.state)) {
    /**
     * Clean up state tree
     * if is es module
     */
    if (anewStore.state.__esModule) {
      var _anewStore$state = anewStore.state,
          __esModule = _anewStore$state.__esModule,
          state = _objectWithoutPropertiesLoose(_anewStore$state, ["__esModule"]);

      anewStore.state = state;
    }

    return function setState(stateChange) {
      if (!!stateChange && stateChange !== anewStore.state) {
        anewStore.state = _objectSpread({}, anewStore.state, stateChange);
      }

      return anewStore.state;
    };
  }

  return function setState(stateChange) {
    if (!!stateChange && stateChange !== anewStore.state) {
      anewStore.state = stateChange;
    }

    return anewStore.state;
  };
}