'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createTestEnv;

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createTestEnv(store) {
    return function createStore() {
        store.dispatch({ type: _actionTypes2.default.RESET });

        return store;
    };
}