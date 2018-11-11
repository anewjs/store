'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createSetState;

var _isPlainObject = require('./isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) { continue; } if (!Object.prototype.hasOwnProperty.call(obj, i)) { continue; } target[i] = obj[i]; } return target; }

function createSetState(anewStore) {
    if ((0, _isPlainObject2.default)(anewStore.state)) {
        /**
         * Clean up state tree
         */
        var _anewStore$state = anewStore.state,
            __esModule = _anewStore$state.__esModule,
            state = _objectWithoutProperties(_anewStore$state, ['__esModule']);

        anewStore.state = state;

        return function setState(stateChange) {
            if (!!stateChange && stateChange !== anewStore.state) {
                anewStore.state = _extends({}, anewStore.state, stateChange);
            }

            return anewStore.state;
        };
    }

    return function setState(stateChange) {
        if (stateChange !== anewStore.state) {
            anewStore.state = stateChange;
        }

        return anewStore.state;
    };
}