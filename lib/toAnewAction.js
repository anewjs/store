'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = toAnewAction;

var _actionTypes = require('./actionTypes');

function toAnewAction(actionType) {
    return actionType.replace(_actionTypes.DELIMITER, '').replace('/', _actionTypes.SEPERATOR).split(_actionTypes.SEPERATOR);
}