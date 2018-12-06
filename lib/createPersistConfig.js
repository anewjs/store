function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import persistStorage from 'redux-persist/lib/storage';
/**
 * Convert true presits to config object
 */

export default function createPersistConfig(persist, name) {
  switch (typeof persist) {
    case 'boolean':
      if (persist) {
        persist = {
          key: name,
          storage: persistStorage
        };
      }

      break;

    case 'object':
      persist = _objectSpread({
        storage: persistStorage
      }, persist, {
        key: name
      });
      break;
  }

  return persist;
}