'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = createPersistConfig;

var _storage = require('redux-persist/lib/storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert true presits to config object
 */
function createPersistConfig(persist, name) {
    switch (typeof persist === 'undefined' ? 'undefined' : _typeof(persist)) {
        case 'boolean':
            if (persist) {
                persist = {
                    key: name,
                    storage: _storage2.default
                };
            }

            break;
        case 'object':
            persist = _extends({
                storage: _storage2.default
            }, persist, {
                key: name
            });

            break;
    }

    return persist;
}