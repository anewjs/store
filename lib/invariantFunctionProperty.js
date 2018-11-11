'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = invariantFunctionProperty;

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var functionProperties = ['__proto__', 'arguments', 'caller', 'length', 'name', 'prototype', '[[FunctionLocation]]', '[[Scopes]]'];

function invariantFunctionProperty(name, objectName) {
    (0, _invariant2.default)(functionProperties.indexOf(name) === -1, '"' + name + ' is a reserved function property. Please choose a different name " ' + ('for "' + name + '" in "' + objectName + '"'));
}