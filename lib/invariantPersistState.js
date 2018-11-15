'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = invariantPersistState;

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _isPlainObject = require('./isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function invariantPersistState(name, state, persist) {
    if (persist) {
        (0, _invariant2.default)((0, _isPlainObject2.default)(state), 'Persist requires a plain object state. Please wrap ' + ('the current state in "' + name + '" store with a plain object or turn persist off.'));
    }
}